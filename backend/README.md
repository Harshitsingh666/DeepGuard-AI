# Backend

This small Node.js service serves the frontend and exposes a health endpoint. It uses only Node's built-in modules, so there are no package dependencies to install.

```bash
npm start
```

By default, the server listens on `http://127.0.0.1:3000`.

## API

### `GET /api/health`

Returns a JSON response such as:

```json
{
  "status": "ok",
  "service": "deepguard-ai",
  "timestamp": "2026-11-25T00:00:00.000Z"
}
```

Set `PORT` to choose another port. Set `HOST=0.0.0.0` only when the service must accept connections from outside the local machine.

The media-analysis features still run in the browser. This backend does not receive uploaded media or invoke a hosted AI model.
