const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const frontendRoot = path.resolve(__dirname, '..', 'frontend');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  response.end(JSON.stringify(body));
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');

  if (url.pathname === '/api/health') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('allow', 'GET, HEAD');
      return sendJson(response, 405, { status: 'error', message: 'Method not allowed' });
    }
    response.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    });
    return response.end(request.method === 'HEAD' ? undefined : JSON.stringify({
      status: 'ok',
      service: 'deepguard-ai',
      timestamp: new Date().toISOString()
    }));
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('allow', 'GET, HEAD');
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return sendJson(response, 400, { error: 'Invalid URL path' });
  }
  if (pathname.includes('\0')) return sendJson(response, 400, { error: 'Invalid URL path' });

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(frontendRoot, relativePath);
  const relative = path.relative(frontendRoot, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return sendJson(response, 403, { error: 'Forbidden' });
  }

  fs.readFile(filePath, (error, content) => {
    if (error) return sendJson(response, ['ENOENT', 'EISDIR'].includes(error.code) ? 404 : 500, { error: 'File not found' });
    response.writeHead(200, {
      'content-type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache',
      'x-content-type-options': 'nosniff'
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  });
});

server.listen(port, host, () => {
  console.log(`DeepGuard AI is available at http://${host}:${port}`);
  console.log(`Health check: http://${host}:${port}/api/health`);
});

server.on('error', (error) => {
  console.error(`Could not start DeepGuard AI: ${error.message}`);
  process.exitCode = 1;
});
