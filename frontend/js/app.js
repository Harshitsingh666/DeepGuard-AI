
    /*************************************************************************
     * MODULE 1: Config — Global Constants, CDN Endpoints & I18N Dictionary
     *************************************************************************/
    const Config = {
      MAX_VIDEO_BYTES: 150 * 1024 * 1024, // 150 MB
      VIDEO_SAMPLE_FRAMES: 12,
      THUMB_WIDTH: 96,
      THUMB_HEIGHT: 64,
      MEDIAPIPE_CDN: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14',
      MEDIAPIPE_WASM_BASE: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
      FACE_LANDMARKER_MODEL: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      ONNX_RUNTIME_VERSION: '1.31.1',
      IMAGE_MODEL_URL: 'https://huggingface.co/TensorFold/detectra-v1/resolve/d8709d3c39aa69ab862748badce0d4a06e90bf4c/model.onnx',
      IMAGE_MODEL_SHA256: '1414b9aafaa01a644ed706224973f09b53a1388282104409862df9893b1b962b',
      IMAGE_MODEL_BYTES: 43684258,
      I18N: {
        en: {
          hero_tag: 'LOCAL MEDIA SIGNALS + MEDIAPIPE + OPTIONAL IMAGE MODEL',
          hero_headline: "Don't Trust What You See. Verify What You Hear.",
          hero_sub: 'Review media with browser-based signal analysis, metadata checks, and optional AI models. Your files stay on your device; optional model files are fetched from public CDNs. Results are indicators for review, not proof of authenticity or manipulation.',
          btn_start: 'Start Detection'
        },
        hi: {
          hero_tag: 'स्थानीय मीडिया संकेत + MEDIAPIPE + वैकल्पिक छवि मॉडल',
          hero_headline: 'जो दिखता है उस पर आँख मूँदकर भरोसा न करें। जो सुनते हैं उसकी पुष्टि करें।',
          hero_sub: 'मीडिया की समीक्षा ब्राउज़र में सिग्नल विश्लेषण, मेटाडेटा और वैकल्पिक AI मॉडल से करें। आपकी फ़ाइलें डिवाइस पर रहती हैं; वैकल्पिक मॉडल सार्वजनिक CDN से लोड होते हैं। परिणाम संकेत हैं, प्रामाणिकता या छेड़छाड़ का प्रमाण नहीं।',
          btn_start: 'जाँच शुरू करें'
        }
      }
    };

    // Configure PDF.js worker if loaded
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    /*************************************************************************
     * MODULE 2: ToastUI — Non-Blocking Notifications & Custom Confirm Dialog
     *************************************************************************/
    const ToastUI = {
      show(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const palette = {
          info: 'border-cyan-400/40 bg-slate-900/95 text-cyan-200',
          success: 'border-emerald-400/40 bg-slate-900/95 text-emerald-200',
          warn: 'border-amber-400/40 bg-slate-900/95 text-amber-200',
          error: 'border-rose-400/40 bg-slate-900/95 text-rose-200'
        };
        const el = document.createElement('div');
        el.className = `pointer-events-auto glass-card rounded-xl px-4 py-3 border text-xs font-medium shadow-xl transition-all duration-300 ${palette[type] || palette.info}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => {
          el.style.opacity = '0';
          setTimeout(() => el.remove(), 300);
        }, 3800);
      },

      confirm(title, message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        const close = () => {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        };
        document.getElementById('confirm-cancel-btn').onclick = close;
        document.getElementById('confirm-ok-btn').onclick = () => {
          close();
          onConfirm();
        };
      }
    };

    /*************************************************************************
     * MODULE 3: UIController — Navigation, Mobile Drawer, Language & Radar
     *************************************************************************/
    const UIController = {
      currentView: 'home',
      lang: 'en',

      navigateTo(viewId) {
        this.currentView = viewId;
        document.querySelectorAll('.app-view').forEach(sec => sec.classList.add('hidden'));
        const target = document.getElementById(`view-${viewId}`);
        if (target) target.classList.remove('hidden');

        document.querySelectorAll('.nav-pill').forEach(btn => {
          const active = btn.getAttribute('data-nav') === viewId;
          btn.className = active
            ? 'nav-pill px-3 py-1.5 rounded-lg transition bg-cyan-500/20 text-cyan-300 border border-cyan-400/35 font-semibold'
            : 'nav-pill px-3 py-1.5 rounded-lg transition text-slate-300 hover:text-white hover:bg-slate-800/70';
        });

        this.closeMobileDrawer();
        if (viewId === 'dashboard') Dashboard.refresh();
        if (viewId === 'history') HistoryStore.renderHistoryView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },

      openMobileDrawer() {
        document.getElementById('mobile-drawer-backdrop').classList.remove('hidden');
        document.getElementById('mobile-drawer-panel').classList.remove('-translate-x-full');
      },

      closeMobileDrawer() {
        document.getElementById('mobile-drawer-backdrop').classList.add('hidden');
        document.getElementById('mobile-drawer-panel').classList.add('-translate-x-full');
      },

      toggleLanguage() {
        this.lang = this.lang === 'en' ? 'hi' : 'en';
        document.getElementById('lang-label').textContent = this.lang === 'en' ? 'EN / हिंदी' : 'हिंदी / EN';
        document.querySelectorAll('[data-i18n]').forEach(el => {
          const key = el.getAttribute('data-i18n');
          if (Config.I18N[this.lang][key]) el.textContent = Config.I18N[this.lang][key];
        });
        ToastUI.show(this.lang === 'hi' ? 'भाषा हिंदी में बदली गई' : 'Language switched to English', 'info');
      },

      startHeroRadar() {
        const canvas = document.getElementById('hero-radar-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let angle = 0, phase = 0;

        const loop = () => {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          if (rect.width > 0 && canvas.width !== Math.floor(rect.width * dpr)) {
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
          }
          const w = canvas.width, h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          ctx.strokeStyle = 'rgba(0, 210, 255, 0.08)';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
          for (let y = 0; y < h; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

          const cx = w * 0.28, cy = h * 0.5, maxR = Math.min(w * 0.22, h * 0.4);
          [0.35, 0.68, 1.0].forEach(r => {
            ctx.beginPath(); ctx.arc(cx, cy, maxR * r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.25)'; ctx.stroke();
          });

          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
          ctx.strokeStyle = '#00D2FF'; ctx.lineWidth = 2; ctx.stroke();

          const ws = w * 0.54, ww = w * 0.41;
          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const px = ws + (i / 60) * ww;
            const py = h * 0.36 + Math.sin(i * 0.25 + phase) * 15 * Math.sin(i * 0.08);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.strokeStyle = '#00D2FF'; ctx.lineWidth = 2; ctx.stroke();

          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const px = ws + (i / 60) * ww;
            const py = h * 0.68 + Math.cos(i * 0.32 - phase * 1.3) * 13 * Math.cos(i * 0.06);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 2; ctx.stroke();

          angle += 0.03; phase += 0.06;
          if (!reduceMotion) requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      },

      setupDropzones() {
        const pairs = [
          ['video-dropzone', f => VideoForensics.processFile(f)],
          ['audio-dropzone', f => AudioForensics.processFile(f)],
          ['image-dropzone', f => ImageForensics.processFile(f)]
        ];
        pairs.forEach(([id, fn]) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('dropzone-active'); });
          el.addEventListener('dragleave', () => el.classList.remove('dropzone-active'));
          el.addEventListener('drop', e => {
            e.preventDefault();
            el.classList.remove('dropzone-active');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) fn(e.dataTransfer.files[0]);
          });
        });
      }
    };

    /*************************************************************************
     * MODULE 4: WorkerML — Detectra image model (ONNX WebGPU/WASM) + MediaPipe
     *************************************************************************/
    const WorkerML = {
      worker: null,
      ready: false,
      imageModelAvailable: false,
      deviceBackend: 'WASM',
      pendingRequests: new Map(),
      reqCounter: 0,
      faceLandmarker: null,
      faceLandmarkerAttempted: false,

      init() {
        if (this.worker) return;
        const workerCode = `
          let ort = null;
          let imageSession = null;
          let activeDevice = 'wasm';

          async function loadImageSession() {
            if (imageSession) return imageSession;
            const base = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@${Config.ONNX_RUNTIME_VERSION}/dist/';
            const response = await fetch('${Config.IMAGE_MODEL_URL}', { cache: 'force-cache' });
            if (!response.ok) throw new Error('Could not download the image model from Hugging Face.');
            const modelBytes = await response.arrayBuffer();
            const digest = await crypto.subtle.digest('SHA-256', modelBytes);
            const sha256 = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
            if (sha256 !== '${Config.IMAGE_MODEL_SHA256}') throw new Error('Image model integrity check failed.');

            const canUseGpu = typeof navigator !== 'undefined' && navigator.gpu;
            if (canUseGpu) {
              try {
                ort = await import(base + 'ort.webgpu.min.mjs');
                ort.env.wasm.wasmPaths = base;
                imageSession = await ort.InferenceSession.create(modelBytes, { executionProviders: ['webgpu'] });
                activeDevice = 'webgpu';
                return imageSession;
              } catch (_) {
                imageSession = null;
              }
            }
            ort = await import(base + 'ort.min.mjs');
            ort.env.wasm.wasmPaths = base;
            imageSession = await ort.InferenceSession.create(modelBytes, { executionProviders: ['wasm'] });
            activeDevice = 'wasm';
            return imageSession;
          }

          async function classifyAiImage(blob) {
            const session = await loadImageSession();
            const image = await createImageBitmap(blob);
            const scale = 440 / Math.min(image.width, image.height);
            const cropSize = 384 / scale;
            const canvas = new OffscreenCanvas(384, 384);
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(image, (image.width - cropSize) / 2, (image.height - cropSize) / 2, cropSize, cropSize, 0, 0, 384, 384);
            image.close();

            const rgba = ctx.getImageData(0, 0, 384, 384).data;
            const pixels = new Float32Array(3 * 384 * 384);
            const mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225];
            for (let i = 0; i < 384 * 384; i++) {
              for (let c = 0; c < 3; c++) pixels[c * 384 * 384 + i] = (rgba[i * 4 + c] / 255 - mean[c]) / std[c];
            }

            const input = new ort.Tensor('float32', pixels, [1, 3, 384, 384]);
            const output = await session.run({ pixel_values: input });
            const logit = output[session.outputNames[0]].data[0];
            return 1 / (1 + Math.exp(-logit));
          }

          self.onmessage = async (e) => {
            const { id, type, payload } = e.data;
            try {
              if (type === 'WARMUP') {
                self.postMessage({ type: 'PROGRESS', label: 'Loading image model (43.7 MB)...', pct: 10 });
                await loadImageSession();
                self.postMessage({ id, type: 'RESULT', ok: true, data: { device: activeDevice } });
              } else if (type === 'DETECT_AI_IMAGE') {
                self.postMessage({ type: 'PROGRESS', label: 'Loading Detectra v3 image model (43.7 MB)...', pct: 10 });
                const score = await classifyAiImage(payload.file);
                self.postMessage({ type: 'PROGRESS', label: 'Image model analysis complete.', pct: 100 });
                self.postMessage({ id, type: 'RESULT', ok: true, data: { score, device: activeDevice } });
              }
            } catch (err) {
              self.postMessage({ id, type: 'RESULT', ok: false, error: err && err.message ? err.message : 'Image model unavailable' });
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob), { type: 'module' });

        this.worker.onmessage = (e) => {
          const msg = e.data;
          if (msg.type === 'PROGRESS') {
            this.updateProgressUI(msg.label, msg.pct);
            return;
          }
          if (msg.type === 'RESULT' && this.pendingRequests.has(msg.id)) {
            const { resolve } = this.pendingRequests.get(msg.id);
            this.pendingRequests.delete(msg.id);
            resolve(msg);
          }
        };

        this.worker.onerror = () => {
          this.imageModelAvailable = false;
          this.setStatusPill('AI Engine: DSP / ELA Active (Worker Offline)', 'amber');
        };
      },

      callWorker(type, payload = {}, timeoutMs = 15000) {
        this.init();
        return new Promise((resolve) => {
          const id = ++this.reqCounter;
          const timer = setTimeout(() => {
            if (this.pendingRequests.has(id)) {
              this.pendingRequests.delete(id);
              resolve({ ok: false, error: 'Model load timeout — using deterministic DSP/ELA engine' });
            }
          }, timeoutMs);

          this.pendingRequests.set(id, {
            resolve: (res) => {
              clearTimeout(timer);
              resolve(res);
            }
          });
          this.worker.postMessage({ id, type, payload });
        });
      },

      updateProgressUI(label, pct) {
        const strip = document.getElementById('ml-progress-strip');
        if (!strip) return;
        strip.classList.remove('hidden');
        document.getElementById('ml-progress-label').textContent = label;
        document.getElementById('ml-progress-pct').textContent = `${pct}%`;
        document.getElementById('ml-progress-bar').style.width = `${pct}%`;
        if (pct >= 100) {
          setTimeout(() => strip.classList.add('hidden'), 1200);
        }
      },

      setStatusPill(text, color = 'emerald') {
        const txt = document.getElementById('ml-status-text');
        const dot = document.getElementById('ml-status-dot');
        const mob = document.getElementById('mobile-ml-status');
        if (txt) txt.textContent = text;
        if (mob) mob.textContent = text;
        if (dot) {
          dot.className = color === 'emerald'
            ? 'w-2 h-2 rounded-full bg-emerald-400'
            : color === 'cyan'
              ? 'w-2 h-2 rounded-full bg-cyan-400 animate-ping'
              : 'w-2 h-2 rounded-full bg-amber-400';
        }
      },

      async warmUpModels() {
        this.setStatusPill('Loading Detectra image model (43.7 MB)...', 'cyan');
        this.updateProgressUI('Loading pinned Detectra v3 image model...', 5);

        const mpPromise = this.getFaceLandmarker();
        const onnxRes = await this.callWorker('WARMUP', {}, 120000);
        const mpLandmarker = await mpPromise;

        if (onnxRes.ok) {
          this.updateProgressUI('Detectra v3 image model ready', 100);
          this.imageModelAvailable = true;
          this.deviceBackend = onnxRes.data.device.toUpperCase();
          this.setStatusPill(`Image model: Detectra v3 (${this.deviceBackend})`, 'emerald');
          ToastUI.show(`Detectra v3 image model is ready (${this.deviceBackend}).`, 'success');
        } else {
          this.updateProgressUI('Image model unavailable', 100);
          this.imageModelAvailable = false;
          this.setStatusPill(`Image model unavailable • ${mpLandmarker ? 'MediaPipe 478' : 'local signals'} ready`, 'amber');
          ToastUI.show('Image model unavailable; local signal analysis remains available.', 'warn');
        }
      },

      async getFaceLandmarker() {
        if (this.faceLandmarker) return this.faceLandmarker;
        if (this.faceLandmarkerAttempted) return null;
        this.faceLandmarkerAttempted = true;
        try {
          const vision = await import(Config.MEDIAPIPE_CDN);
          const fileset = await vision.FilesetResolver.forVisionTasks(Config.MEDIAPIPE_WASM_BASE);
          this.faceLandmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: Config.FACE_LANDMARKER_MODEL,
              delegate: 'GPU'
            },
            outputFaceBlendshapes: true,
            runningMode: 'IMAGE',
            numFaces: 1
          });
          return this.faceLandmarker;
        } catch (_) {
          this.faceLandmarker = null;
          return null;
        }
      }
    };

    /*************************************************************************
     * MODULE 5: CryptoMeta — SHA-256 Hashing, EXIF/XMP/C2PA Parser & Comparator
     *************************************************************************/
    const CryptoMeta = {
      compareSlots: { A: null, B: null },

      async sha256Buffer(arrayBuffer) {
        const digest = await crypto.subtle.digest('SHA-256', arrayBuffer);
        return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
      },

      async sha256String(str) {
        return this.sha256Buffer(new TextEncoder().encode(str).buffer);
      },

      generateAnalysisId() {
        const yr = new Date().getFullYear();
        const hex = crypto.getRandomValues(new Uint32Array(1))[0].toString(16).toUpperCase().padStart(8, '0').slice(0, 6);
        return `DG-${yr}-${hex}`;
      },

      formatBytes(bytes) {
        if (!bytes) return '0 B';
        const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
      },

      formatTimeSec(sec) {
        const s = Math.max(0, Math.floor(sec || 0));
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      },

      // Expanded binary header parser extracting EXIF/XMP fields, dates, camera make/model & C2PA
      inspectBinaryMetadata(arrayBuffer, fileName, mimeType) {
        const bytes = new Uint8Array(arrayBuffer);
        const headLen = Math.min(bytes.length, 163840);
        const tailStart = Math.max(headLen, bytes.length - 32768);
        let ascii = '';
        for (let i = 0; i < headLen; i++) ascii += (bytes[i] >= 32 && bytes[i] <= 126) ? String.fromCharCode(bytes[i]) : ' ';
        for (let i = tailStart; i < bytes.length; i++) ascii += (bytes[i] >= 32 && bytes[i] <= 126) ? String.fromCharCode(bytes[i]) : ' ';

        const aiTools = ['Midjourney', 'DALL-E', 'Stable Diffusion', 'ComfyUI', 'Automatic1111', 'Adobe Firefly', 'Runway', 'Sora', 'Kling', 'HeyGen', 'ElevenLabs', 'Synthesia'];
        const editors = ['Adobe Premiere', 'Photoshop', 'After Effects', 'Lavf', 'HandBrake', 'CapCut', 'FFmpeg', 'DaVinci Resolve', 'Audacity', 'GIMP'];
        const cameras = ['Canon', 'Nikon', 'SONY', 'Apple', 'iPhone', 'Samsung', 'Pixel', 'FUJIFILM', 'GoPro', 'DJI'];

        const detectedAI = aiTools.filter(t => ascii.toLowerCase().includes(t.toLowerCase()));
        const detectedEditors = editors.filter(t => ascii.toLowerCase().includes(t.toLowerCase()));
        const detectedCameras = cameras.filter(t => ascii.includes(t));

        // Extract EXIF timestamp pattern YYYY:MM:DD HH:MM:SS if present
        const dateMatch = ascii.match(/\b(20\d{2}:\d{2}:\d{2}\s+\d{2}:\d{2}:\d{2})\b/);
        const exifDate = dateMatch ? dateMatch[1] : 'Not Embedded';

        // Extract readable Software / Model snippet
        const swMatch = ascii.match(/(?:Software|CreatorTool|Make|Model)[:=\s]+([A-Za-z0-9._\-\s]{3,36})/);
        const extractedField = swMatch ? swMatch[1].trim() : 'None';

        const hasExif = ascii.includes('Exif');
        const hasXmp = ascii.includes('http://ns.adobe.com/xap/1.0/') || ascii.includes('xmpmeta');
        const hasC2PA = ascii.includes('c2pa') || ascii.includes('jumb') || ascii.includes('c2ma');

        let c2paStatus = 'Not Present (Stripped or Unsigned)';
        if (hasC2PA) c2paStatus = 'C2PA / JUMBF Content Credential Manifest Detected';
        else if (detectedAI.length > 0) c2paStatus = `AI Generator Signature Embedded (${detectedAI.join(', ')})`;

        return {
          fileName,
          mimeType: mimeType || 'application/octet-stream',
          hasExif,
          hasXmp,
          hasC2PA,
          c2paStatus,
          detectedAI,
          detectedEditors,
          detectedCameras,
          exifDate,
          extractedField
        };
      },

      classifyFraudRisk(verdict, anomalyScore) {
        if (verdict === 'Inconclusive') {
          return {
            tier: 'INCONCLUSIVE',
            badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
            recommendations: [
              'Signal quality or sample length was insufficient; request the uncompressed original media file.',
              'Do not rely on automated scores alone for high-stakes financial or identity decisions.',
              'Verify the sender through an independent trusted callback channel.'
            ]
          };
        }
        if (verdict.includes('Manipulated') || verdict.includes('AI-Generated')) {
          if (anomalyScore >= 68) {
            return {
              tier: 'HIGH RISK',
              badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
              recommendations: [
                'High synthetic or manipulation indicators detected—do NOT share or amplify this asset.',
                'Independently confirm any urgent financial or identity request via a secondary verified channel.',
                'Retain this PDF forensic certificate and SHA-256 hash if reporting impersonation or fraud.'
              ]
            };
          }
          return {
            tier: 'MODERATE RISK',
            badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
            recommendations: [
              'Notable signal or structural anomalies detected; treat content with heightened caution.',
              'Cross-check the original publishing source before acting on claims in this media.'
            ]
          };
        }
        return {
          tier: 'LOW RISK',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          recommendations: [
            'No dominant synthetic or tampering artifacts detected in the evaluated signal channels.',
            'Continue standard source verification—authentic media can still be shared out of context.'
          ]
        };
      },

      async handleStandaloneVerify(e) {
        const file = e.target.files[0];
        if (!file) return;
        const buf = await file.arrayBuffer();
        const sha256 = await this.sha256Buffer(buf);
        const meta = this.inspectBinaryMetadata(buf, file.name, file.type);

        const box = document.getElementById('verify-single-result');
        box.classList.remove('hidden');
        box.innerHTML = `
          <div class="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white">${this.escapeHtml(file.name)}</span>
              <span class="font-mono text-cyan-400">${this.formatBytes(file.size)}</span>
            </div>
            <p class="font-mono text-[11px] text-slate-400 break-all">SHA-256: ${sha256}</p>
            <div class="grid sm:grid-cols-2 gap-2 pt-2">
              <div class="p-2 rounded bg-slate-900">EXIF Header: <strong class="${meta.hasExif ? 'text-emerald-400' : 'text-slate-300'}">${meta.hasExif ? 'Present' : 'Not Found'}</strong></div>
              <div class="p-2 rounded bg-slate-900">XMP Packet: <strong class="${meta.hasXmp ? 'text-emerald-400' : 'text-slate-300'}">${meta.hasXmp ? 'Present' : 'Not Found'}</strong></div>
              <div class="p-2 rounded bg-slate-900">EXIF Timestamp: <strong class="text-slate-200">${this.escapeHtml(meta.exifDate)}</strong></div>
              <div class="p-2 rounded bg-slate-900">Header Tag: <strong class="text-slate-200">${this.escapeHtml(meta.extractedField)}</strong></div>
              <div class="p-2 rounded bg-slate-900 sm:col-span-2">C2PA / Generator Status: <strong class="text-cyan-300">${this.escapeHtml(meta.c2paStatus)}</strong></div>
              <div class="p-2 rounded bg-slate-900 sm:col-span-2">Detected Make / Software: <strong class="text-slate-200">${this.escapeHtml(meta.detectedCameras.concat(meta.detectedEditors, meta.detectedAI).join(', ') || 'None embedded')}</strong></div>
            </div>
            <p class="text-[11px] text-slate-400 pt-1">Note: Messaging apps and social networks routinely strip EXIF and C2PA credentials during recompression; stripped metadata alone does not prove forgery.</p>
          </div>
        `;
        ToastUI.show('EXIF, XMP & C2PA binary inspection complete.', 'success');
      },

      async handleCompareFile(slot, e) {
        const file = e.target.files[0];
        if (!file) return;
        const buf = await file.arrayBuffer();
        const sha256 = await this.sha256Buffer(buf);
        this.compareSlots[slot] = { name: file.name, size: file.size, sha256 };
        document.getElementById(`compare-name-${slot.toLowerCase()}`).textContent = `${file.name} (${this.formatBytes(file.size)})`;

        const { A, B } = this.compareSlots;
        if (A && B) {
          const match = A.sha256 === B.sha256;
          const delta = B.size - A.size;
          document.getElementById('compare-result-box').innerHTML = `
            <div class="space-y-2">
              <div class="p-2.5 rounded-lg border font-bold ${match ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-300'}">
                ${match ? '✓ BIT-FOR-BIT IDENTICAL (Cryptographic Match)' : '⚠ HASH MISMATCH (File Modified or Re-encoded)'}
              </div>
              <p class="font-mono text-[11px] break-all"><span class="text-cyan-400">File A SHA-256:</span> ${A.sha256}</p>
              <p class="font-mono text-[11px] break-all"><span class="text-purple-400">File B SHA-256:</span> ${B.sha256}</p>
              <p class="text-[11px] text-slate-300">Byte Size Delta: <strong>${delta >= 0 ? '+' : ''}${delta.toLocaleString()} bytes</strong></p>
            </div>
          `;
        }
      },

      escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }
    };

    /*************************************************************************
     * MODULE 5B: SyntheticArtDetector — Anime, Cartoon & Fictional Character Guard
     * Canvas heuristics for non-photographic style signals
     *************************************************************************/
    const SyntheticArtDetector = {
      /**
       * Evaluates an HTMLCanvasElement for anime, 2D/3D cartoon, illustration,
       * CGI render, or fictional character signatures.
       */
      async analyzeCanvas(canvas) {
        const w = canvas.width;
        const h = canvas.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, w, h).data;

        // 1. Color Quantization / Cel-Shading Flatness (4x4 non-overlapping patches)
        let totalPatches = 0;
        let flatPatches = 0;
        for (let py = 0; py <= h - 4; py += 4) {
          for (let px = 0; px <= w - 4; px += 4) {
            let sumR = 0, sumG = 0, sumB = 0;
            let sqR = 0, sqG = 0, sqB = 0;
            for (let dy = 0; dy < 4; dy++) {
              for (let dx = 0; dx < 4; dx++) {
                const idx = ((py + dy) * w + (px + dx)) * 4;
                const r = imgData[idx], g = imgData[idx + 1], b = imgData[idx + 2];
                sumR += r; sumG += g; sumB += b;
                sqR += r * r; sqG += g * g; sqB += b * b;
              }
            }
            const varR = (sqR / 16) - Math.pow(sumR / 16, 2);
            const varG = (sqG / 16) - Math.pow(sumG / 16, 2);
            const varB = (sqB / 16) - Math.pow(sumB / 16, 2);
            const patchStd = Math.sqrt(Math.max(0, (varR + varG + varB) / 3));
            totalPatches++;
            if (patchStd <= 2.1) flatPatches++;
          }
        }
        const flatnessPct = totalPatches > 0 ? (flatPatches / totalPatches) * 100 : 0;

        // 2. Ink-Outline Edge Sharpness Ratio vs Interior Sensor ISO Noise
        let strongEdgeSum = 0, strongEdgeCount = 0;
        let interiorNoiseSum = 0, interiorCount = 0;
        let highSatPixels = 0, validSatPixels = 0;
        const colorBins = new Uint16Array(4096); // 12-bit RGB quantization

        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            const r = imgData[idx], g = imgData[idx + 1], b = imgData[idx + 2];

            // Quantized palette bin
            const bin = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
            colorBins[bin]++;

            // Chromatic Saturation Skew
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            if (maxC > 24) {
              validSatPixels++;
              const sat = (maxC - minC) / maxC;
              if (sat > 0.56) highSatPixels++;
            }

            // Sobel gradient on luminance
            const lumaAt = (xx, yy) => {
              const ii = (yy * w + xx) * 4;
              return 0.299 * imgData[ii] + 0.587 * imgData[ii + 1] + 0.114 * imgData[ii + 2];
            };
            const tl = lumaAt(x - 1, y - 1), tc = lumaAt(x, y - 1), tr = lumaAt(x + 1, y - 1);
            const ml = lumaAt(x - 1, y),     mc = lumaAt(x, y),     mr = lumaAt(x + 1, y);
            const bl = lumaAt(x - 1, y + 1), bc = lumaAt(x, y + 1), br = lumaAt(x + 1, y + 1);

            const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
            const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
            const sobel = Math.sqrt(gx * gx + gy * gy);

            if (sobel > 95) {
              strongEdgeSum += sobel;
              strongEdgeCount++;
            } else if (sobel < 22) {
              // High-frequency Laplacian residual in smooth interior (sensor ISO micro-grain)
              const lap = Math.abs(4 * mc - tc - bc - ml - mr);
              interiorNoiseSum += lap;
              interiorCount++;
            }
          }
        }

        const meanStrongEdge = strongEdgeCount > 0 ? strongEdgeSum / strongEdgeCount : 0;
        const meanInteriorNoise = interiorCount > 0 ? interiorNoiseSum / interiorCount : 2.5;
        // Sensor noise deficit (0% = noisy real camera sensor, 100% = sterile digital/cel fill)
        const sensorNoiseDeficit = Math.max(0, Math.min(100, ((2.8 - meanInteriorNoise) / 2.8) * 100));
        const edgeSharpnessRatio = meanStrongEdge / Math.max(meanInteriorNoise, 0.2);
        const highSatPct = validSatPixels > 0 ? (highSatPixels / validSatPixels) * 100 : 0;

        // Palette concentration (top 24 bins share)
        const sortedBins = Array.from(colorBins).sort((a, b) => b - a);
        const top24Share = sortedBins.slice(0, 24).reduce((a, b) => a + b, 0) / Math.max((w - 2) * (h - 2), 1);

        // Combine deterministic non-photorealistic heuristic score (0-100)
        let heuristicScore = 0;
        if (flatnessPct >= 52) heuristicScore += 36;
        else if (flatnessPct >= 36) heuristicScore += 20;

        if (sensorNoiseDeficit >= 72 && edgeSharpnessRatio >= 95) heuristicScore += 36;
        else if (sensorNoiseDeficit >= 55 && edgeSharpnessRatio >= 65) heuristicScore += 20;

        if (highSatPct >= 28 || top24Share >= 0.62) heuristicScore += 24;
        else if (highSatPct >= 18 || top24Share >= 0.48) heuristicScore += 12;

        heuristicScore = Math.min(100, Math.round(heuristicScore));

        const isSyntheticArt = heuristicScore >= 58;
        const effectiveConf = heuristicScore;
        const detectedCategory = highSatPct > 25 ? 'anime / 2D cartoon illustration' : 'CGI / fictional character render';

        const badge = 'Cel-Shading Heuristic';

        const xaiFinding = {
          name: 'Illustrated or Non-Photographic Style Signal',
          badge,
          region: `${w}×${h} Pixel Matrix (visual style indicators)`,
          explanation: `Visual style indicators resemble "${detectedCategory}" (model or heuristic signal: ${effectiveConf}%). Cel-shading flatness=${flatnessPct.toFixed(1)}%, edge-to-texture ratio=${edgeSharpnessRatio.toFixed(1)}, low-texture estimate=${sensorNoiseDeficit.toFixed(1)}%, vibrant color share=${highSatPct.toFixed(1)}%. This describes visual style only; it cannot establish whether media was AI-generated or manipulated.`
        };

        return {
          isSyntheticArt,
          detectedCategory,
          effectiveConf,
          flatnessPct,
          edgeSharpnessRatio,
          sensorNoiseDeficit,
          highSatPct,
          heuristicScore,
          xaiFinding
        };
      }
    };

    /*************************************************************************
     * MODULE 6: VideoForensics — 12-Keyframe Thumbnails, MediaPipe 478 & AV Sync
     *************************************************************************/
    const VideoForensics = {
      handleUpload(e) {
        const file = e.target.files[0];
        if (file) this.processFile(file);
      },

      async processFile(file) {
        if (!file.type.startsWith('video/') && !/\.(mp4|webm|mov|avi)$/i.test(file.name)) {
          ToastUI.show('Unsupported video format. Please upload MP4, WEBM, MOV, or AVI.', 'error');
          return;
        }
        if (file.size > Config.MAX_VIDEO_BYTES) {
          ToastUI.show('Video exceeds the 150 MB browser analysis limit.', 'error');
          return;
        }

        const progBox = document.getElementById('video-progress-box');
        const progBar = document.getElementById('video-progress-bar');
        const progLabel = document.getElementById('video-progress-label');
        const progPct = document.getElementById('video-progress-pct');
        progBox.classList.remove('hidden');
        document.getElementById('video-results-container').classList.add('hidden');

        const setProg = (pct, msg) => {
          progBar.style.width = `${pct}%`;
          progPct.textContent = `${pct}%`;
          progLabel.textContent = msg;
        };

        try {
          setProg(10, 'Computing SHA-256 hash & scanning container atoms...');
          const arrayBuf = await file.arrayBuffer();
          const sha256 = await CryptoMeta.sha256Buffer(arrayBuf);
          const metadata = CryptoMeta.inspectBinaryMetadata(arrayBuf, file.name, file.type);

          const url = URL.createObjectURL(file);
          const player = document.getElementById('video-player');
          player.src = url;
          player.ontimeupdate = () => {
            document.getElementById('video-current-time-badge').textContent = CryptoMeta.formatTimeSec(player.currentTime);
          };

          const probe = document.createElement('video');
          probe.muted = true;
          probe.playsInline = true;
          probe.src = url;
          await new Promise((res, rej) => {
            probe.onloadedmetadata = res;
            probe.onerror = () => rej(new Error('Browser could not decode this video stream. Try H.264 MP4 or WebM.'));
          });

          const duration = isFinite(probe.duration) && probe.duration > 0 ? probe.duration : 4.0;
          const numFrames = Config.VIDEO_SAMPLE_FRAMES; // 12 evenly spaced keyframes

          // Full analysis canvas (256x144) + 96x64 JPEG thumbnail canvas
          const workCanvas = document.createElement('canvas');
          workCanvas.width = 256;
          workCanvas.height = 144;
          const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });

          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = Config.THUMB_WIDTH;
          thumbCanvas.height = Config.THUMB_HEIGHT;
          const thumbCtx = thumbCanvas.getContext('2d');

          const landmarker = await WorkerML.getFaceLandmarker();
          const usingMediaPipe = Boolean(landmarker);

          const frames = [];
          let syntheticArtFrames = 0;
          let representativeArtResult = null;

          for (let i = 0; i < numFrames; i++) {
            const t = Math.min(duration - 0.05, (i + 0.5) * (duration / numFrames));
            setProg(18 + Math.round((i / numFrames) * 58), `Analyzing keyframe ${i + 1}/${numFrames} (${usingMediaPipe ? 'MediaPipe 478-Mesh' : 'CV ROI'}) at ${CryptoMeta.formatTimeSec(t)}...`);

            await new Promise((res) => {
              const done = () => { probe.removeEventListener('seeked', done); res(); };
              probe.addEventListener('seeked', done);
              probe.currentTime = Math.max(0, t);
            });

            workCtx.drawImage(probe, 0, 0, workCanvas.width, workCanvas.height);
            thumbCtx.drawImage(probe, 0, 0, Config.THUMB_WIDTH, Config.THUMB_HEIGHT);
            const thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.72);

            // Check keyframe for Anime / Cartoon / Fictional Character signatures
            const frameArtCheck = await SyntheticArtDetector.analyzeCanvas(workCanvas);
            if (frameArtCheck.isSyntheticArt) {
              syntheticArtFrames++;
              if (!representativeArtResult || frameArtCheck.effectiveConf > representativeArtResult.effectiveConf) {
                representativeArtResult = frameArtCheck;
              }
            }

            // MediaPipe 478 Facial Landmarks + jawOpen/mouthClose blendshapes
            let mpMouthAperture = null;
            let mpFaceDetected = false;
            if (landmarker) {
              try {
                const mpRes = landmarker.detect(workCanvas);
                if (mpRes && mpRes.faceLandmarks && mpRes.faceLandmarks.length > 0) {
                  mpFaceDetected = true;
                  if (mpRes.faceBlendshapes && mpRes.faceBlendshapes.length > 0) {
                    const cats = mpRes.faceBlendshapes[0].categories;
                    const jawOpen = (cats.find(c => c.categoryName === 'jawOpen') || {}).score || 0;
                    const mouthClose = (cats.find(c => c.categoryName === 'mouthClose') || {}).score || 0;
                    mpMouthAperture = Math.max(0, Math.min(1, jawOpen - mouthClose * 0.45));
                  } else {
                    // Geometric upper/lower inner lip landmarks (#13 and #14 in 478 mesh)
                    const lm = mpRes.faceLandmarks[0];
                    if (lm[13] && lm[14] && lm[10] && lm[152]) {
                      const faceH = Math.max(0.01, Math.abs(lm[152].y - lm[10].y));
                      mpMouthAperture = Math.min(1, (Math.abs(lm[14].y - lm[13].y) / faceH) * 6.5);
                    }
                  }
                }
              } catch (_) {}
            }

            // Pixel luminance, edge sharpness, YCbCr chromaticity & lower-face motion fallback
            const imgData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height).data;
            let faceSum = 0, faceCount = 0, edgeSum = 0, cbSum = 0, crSum = 0;
            const facePixels = [], mouthPixels = [];

            for (let y = 1; y < workCanvas.height - 1; y++) {
              for (let x = 1; x < workCanvas.width - 1; x++) {
                const idx = (y * workCanvas.width + x) * 4;
                const r = imgData[idx], g = imgData[idx + 1], b = imgData[idx + 2];
                const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                if (x >= workCanvas.width * 0.28 && x <= workCanvas.width * 0.72 && y >= workCanvas.height * 0.15 && y <= workCanvas.height * 0.78) {
                  faceSum += luma;
                  faceCount++;
                  facePixels.push(luma);
                  if (y >= workCanvas.height * 0.48 && y <= workCanvas.height * 0.74) mouthPixels.push(luma);
                  const rLuma = 0.299 * imgData[idx + 4] + 0.587 * imgData[idx + 5] + 0.114 * imgData[idx + 6];
                  edgeSum += Math.abs(luma - rLuma);
                  cbSum += 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
                  crSum += 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
                }
              }
            }

            frames.push({
              index: i,
              time: t,
              timeFormatted: CryptoMeta.formatTimeSec(t),
              thumbUrl,
              isSyntheticArtFrame: frameArtCheck.isSyntheticArt,
              mpFaceDetected,
              mpMouthAperture,
              sharpness: edgeSum / Math.max(faceCount, 1),
              cbMean: cbSum / Math.max(faceCount, 1),
              crMean: crSum / Math.max(faceCount, 1),
              facePixels,
              mouthPixels
            });
          }

          // Extract Audio Track via Web Audio decodeAudioData for Lip-Sync Cross-Correlation
          setProg(82, 'Decoding audio track & cross-correlating speech RMS with mouth aperture...');
          let audioWindowRms = null;
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const decoded = await audioCtx.decodeAudioData(arrayBuf.slice(0));
            const pcm = decoded.getChannelData(0);
            const winLen = Math.floor(pcm.length / numFrames);
            audioWindowRms = [];
            for (let i = 0; i < numFrames; i++) {
              let sq = 0;
              for (let j = i * winLen; j < (i + 1) * winLen && j < pcm.length; j++) sq += pcm[j] * pcm[j];
              audioWindowRms.push(Math.sqrt(sq / Math.max(winLen, 1)));
            }
            await audioCtx.close();
          } catch (_) {
            audioWindowRms = null; // Silent video or no audio track
          }

          // Frame-by-frame anomaly & mouth motion evaluation
          const sharpList = frames.map(f => f.sharpness);
          const meanSharp = sharpList.reduce((a, b) => a + b, 0) / numFrames;
          const stdSharp = Math.sqrt(sharpList.reduce((a, b) => a + Math.pow(b - meanSharp, 2), 0) / numFrames);

          const suspiciousTimestamps = [];
          const mouthMotionSeries = [];

          for (let i = 0; i < numFrames; i++) {
            const curr = frames[i];
            const prev = i > 0 ? frames[i - 1] : curr;

            let mad = 0;
            for (let p = 0; p < curr.facePixels.length; p += 4) mad += Math.abs(curr.facePixels[p] - prev.facePixels[p]);
            mad /= Math.max(curr.facePixels.length / 4, 1);

            let mouthSignal = 0;
            if (curr.mpMouthAperture !== null) {
              mouthSignal = curr.mpMouthAperture;
            } else {
              let mMad = 0;
              for (let p = 0; p < curr.mouthPixels.length; p += 2) mMad += Math.abs(curr.mouthPixels[p] - prev.mouthPixels[p]);
              mouthSignal = mMad / Math.max(curr.mouthPixels.length / 2, 1);
            }
            mouthMotionSeries.push(mouthSignal);

            const chromaShift = Math.abs(curr.cbMean - prev.cbMean) + Math.abs(curr.crMean - prev.crMean);
            const sharpZ = stdSharp > 0.1 ? Math.abs(curr.sharpness - meanSharp) / stdSharp : 0;

            let score = 0;
            const reasons = [];
            // Style signals are summarized separately and are not frame manipulation evidence.
            if (!curr.isSyntheticArtFrame) {
              if (i > 0 && mad > 23) { score += 32; reasons.push(`Facial luminance/texture flicker (Δ=${mad.toFixed(1)})`); }
              if (sharpZ > 1.55) { score += 28; reasons.push(`Facial boundary sharpness discontinuity (z=${sharpZ.toFixed(2)})`); }
              if (i > 0 && chromaShift > 3.6) { score += 24; reasons.push(`Skin-tone YCbCr lighting shift (ΔCbCr=${chromaShift.toFixed(2)})`); }
            }

            curr.anomalyScore = Math.min(100, Math.round(score));
            curr.reasons = reasons;

            if (reasons.length > 0) {
              suspiciousTimestamps.push({
                time: curr.time,
                timeFormatted: curr.timeFormatted,
                reason: reasons.join(' • '),
                severity: curr.anomalyScore >= 50 ? 'High' : 'Moderate',
                thumbUrl: curr.thumbUrl
              });
            }
          }

          // Cross-correlate Audio RMS vs Mouth Motion (Graceful N/A if silent)
          let lipSyncStatus = 'N/A — No Audio Track';
          let lipSyncBadge = 'Signal DSP / CV';
          let lipSyncPenalty = 0;
          let lipSyncExplanation = 'No audible speech track was present in this video container; lip-sync verification was marked N/A rather than assumed.';

          const hasAudibleSpeech = audioWindowRms && Math.max(...audioWindowRms) > 0.004;
          if (hasAudibleSpeech) {
            const maxA = Math.max(...audioWindowRms, 0.0001);
            const maxM = Math.max(...mouthMotionSeries, 0.0001);
            let mismatches = 0;
            for (let i = 1; i < numFrames; i++) {
              const nA = audioWindowRms[i] / maxA;
              const nM = mouthMotionSeries[i] / maxM;
              if ((nA > 0.65 && nM < 0.18) || (nA < 0.12 && nM > 0.72)) {
                mismatches++;
                frames[i].anomalyScore = Math.min(100, frames[i].anomalyScore + 35);
                suspiciousTimestamps.push({
                  time: frames[i].time,
                  timeFormatted: frames[i].timeFormatted,
                  reason: `AV Lip-Sync mismatch (Speech RMS=${Math.round(nA * 100)}%, Mouth Aperture=${Math.round(nM * 100)}%)`,
                  severity: 'High',
                  thumbUrl: frames[i].thumbUrl
                });
              }
            }
            const usedMP = frames.some(f => f.mpFaceDetected);
            lipSyncBadge = usedMP ? 'MediaPipe 478-Mesh + WebAudio' : 'CV ROI + WebAudio';
            if (mismatches >= 2) {
              lipSyncStatus = `Lip-Sync Mismatch Detected (${mismatches} windows)`;
              lipSyncPenalty = 28;
              lipSyncExplanation = `Cross-correlation between decoded speech RMS energy and ${usedMP ? 'MediaPipe jawOpen/mouthClose blendshapes' : 'lower-face motion'} found ${mismatches} desynchronized windows.`;
            } else {
              lipSyncStatus = 'Synchronized Envelope (Consistent)';
              lipSyncExplanation = `${usedMP ? 'MediaPipe 478-landmark mouth aperture' : 'Lower-face motion'} correlates normally with speech RMS energy bursts.`;
            }
          }

          const avgAnomaly = frames.reduce((s, f) => s + f.anomalyScore, 0) / numFrames;
          const aiTagBoost = metadata.detectedAI.length > 0 ? 35 : 0;
          let signalScore = Math.min(96, Math.round(avgAnomaly * 1.4 + lipSyncPenalty + aiTagBoost));

          let verdict = 'Likely Authentic';
          if (duration < 0.8) verdict = 'Inconclusive';
          else if (signalScore >= 46 || suspiciousTimestamps.length >= 3) verdict = 'Likely Manipulated';
          else if (signalScore >= 26 || suspiciousTimestamps.length === 2) verdict = 'Inconclusive';

          let risk = CryptoMeta.classifyFraudRisk(verdict, signalScore);
          const mpCount = frames.filter(f => f.mpFaceDetected).length;

          const xaiFindings = [
            {
              name: '12-Keyframe Facial & Landmark Consistency',
              badge: mpCount > 0 ? 'MediaPipe 478-Mesh' : 'Signal DSP / CV',
              region: `12 Keyframes (00:00 – ${CryptoMeta.formatTimeSec(duration)})`,
              explanation: mpCount > 0
                ? `Tracked 478 3D facial vertices across ${mpCount}/12 keyframes. ${suspiciousTimestamps.length > 0 ? `Flagged ${suspiciousTimestamps.length} temporal or boundary anomalies.` : 'Facial geometry and luminance remained temporally stable.'}`
                : `Evaluated facial luminance and Laplacian sharpness (std=${stdSharp.toFixed(2)}) across 12 frames.`
            },
            {
              name: 'Audio-Video Lip-Sync Cross-Correlation',
              badge: lipSyncBadge,
              region: 'Mouth Aperture vs Decoded PCM RMS',
              explanation: lipSyncExplanation
            },
            {
              name: 'Container Metadata & C2PA Provenance',
              badge: 'Cryptographic / Metadata',
              region: 'File Header & Atoms',
              explanation: `C2PA Status: ${metadata.c2paStatus}. Software/Camera markers: ${metadata.detectedAI.concat(metadata.detectedEditors, metadata.detectedCameras).join(', ') || 'None embedded'}.`
            }
          ];

          // A visual-style signal does not establish whether a video was generated or manipulated.
          const isVideoSyntheticArt = (syntheticArtFrames / numFrames) >= 0.5 && representativeArtResult;
          if (isVideoSyntheticArt) {
            xaiFindings.unshift({
              name: 'Illustrated or Non-Photographic Style Signal',
              badge: representativeArtResult.badge,
              region: `${syntheticArtFrames}/${numFrames} Sampled Keyframes (visual style indicators)`,
              explanation: `Visual style indicators resemble "${representativeArtResult.detectedCategory}" across ${syntheticArtFrames}/${numFrames} keyframes (model or heuristic signal: ${representativeArtResult.effectiveConf}%). This does not establish whether the video was AI-generated or manipulated.`
            });
          }

          const record = {
            id: CryptoMeta.generateAnalysisId(),
            timestamp: new Date().toISOString(),
            modality: 'Video',
            fileName: file.name,
            fileSize: CryptoMeta.formatBytes(file.size),
            sha256,
            verdict,
            signalScore,
            riskTier: risk.tier,
            riskBadgeClass: risk.badgeClass,
            recommendations: risk.recommendations,
            lipSyncStatus,
            suspiciousTimestamps,
            xaiFindings,
            metadata,
            frameThumbnails: frames.map(f => ({
              time: f.time,
              timeFormatted: f.timeFormatted,
              score: f.anomalyScore,
              thumbUrl: f.thumbUrl
            }))
          };

          setProg(100, '12-Keyframe & Lip-Sync Forensics Complete');
          setTimeout(() => progBox.classList.add('hidden'), 500);

          HistoryStore.saveRecord(record);
          this.renderResults(record, mpCount);
          ToastUI.show(`Video analysis complete: ${verdict}`, (verdict.includes('Manipulated') || verdict.includes('AI-Generated')) ? 'warn' : 'success');
        } catch (err) {
          progBox.classList.add('hidden');
          ToastUI.show(err.message || 'Video analysis failed.', 'error');
        }
      },

      renderResults(record, mpCount = 0) {
        document.getElementById('video-results-container').classList.remove('hidden');
        document.getElementById('video-mesh-badge').textContent = mpCount > 0 ? `MediaPipe 478-Mesh (${mpCount}/12 frames)` : '12 Sampled Frames (CV Fallback)';

        // Render 12-Keyframe Thumbnail Strip
        const bar = document.getElementById('video-timeline-bar');
        bar.innerHTML = record.frameThumbnails.map(f => {
          const ring = f.score >= 45 ? 'border-rose-400 ring-1 ring-rose-500/50' : f.score >= 22 ? 'border-amber-400' : 'border-slate-700 hover:border-cyan-400';
          return `
            <button onclick="VideoForensics.seekTo(${f.time})" class="group relative rounded-lg overflow-hidden border ${ring} bg-black transition hover:scale-105" title="Seek to ${f.timeFormatted} (Anomaly: ${f.score}%)">
              <img src="${f.thumbUrl}" alt="${f.timeFormatted}" class="w-full h-12 object-cover opacity-90 group-hover:opacity-100" />
              <div class="absolute inset-x-0 bottom-0 bg-slate-950/85 px-1 py-0.5 flex justify-between text-[9px] font-mono">
                <span class="text-white">${f.timeFormatted}</span>
                <span class="${f.score >= 45 ? 'text-rose-400 font-bold' : 'text-cyan-300'}">${f.score}%</span>
              </div>
            </button>
          `;
        }).join('');

        // Clickable Timestamp Chips with 96x64 Thumbnails
        const tsList = document.getElementById('video-timestamps-list');
        if (record.suspiciousTimestamps.length === 0) {
          tsList.innerHTML = `<div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-200">No suspicious facial or lip-sync timestamps exceeded anomaly thresholds across the 12 sampled keyframes.</div>`;
        } else {
          tsList.innerHTML = record.suspiciousTimestamps.map(item => `
            <div onclick="VideoForensics.seekTo(${item.time})" class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-rose-500/30 cursor-pointer transition">
              <img src="${item.thumbUrl}" alt="Frame ${item.timeFormatted}" class="w-20 h-14 object-cover rounded-lg border border-slate-700 shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-xs font-bold">${item.timeFormatted}</span>
                  <span class="text-[11px] font-mono text-amber-300">${item.severity} Anomaly</span>
                </div>
                <p class="text-xs text-slate-300 mt-1 line-clamp-2">${CryptoMeta.escapeHtml(item.reason)}</p>
              </div>
              <span class="text-xs font-mono text-cyan-400 shrink-0">Seek →</span>
            </div>
          `).join('');
        }

        document.getElementById('video-verdict-panel').innerHTML = PDFExport.buildVerdictHTML(record, `
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/25">
            <p class="text-[11px] font-mono text-cyan-400">AUDIO-VIDEO SYNCHRONIZATION STATUS</p>
            <p class="text-xs font-bold text-white mt-0.5">${CryptoMeta.escapeHtml(record.lipSyncStatus)}</p>
          </div>
        `);
      },

      seekTo(sec) {
        const p = document.getElementById('video-player');
        if (p) {
          p.currentTime = sec;
          p.play().catch(() => {});
          ToastUI.show(`Seeked video player to ${CryptoMeta.formatTimeSec(sec)}`, 'info');
        }
      },

      async captureWebcam() {
        const btn = document.getElementById('webcam-record-btn');
        const prev = document.getElementById('webcam-preview');
        const ph = document.getElementById('webcam-placeholder');
        const dot = document.getElementById('webcam-status-dot');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          ToastUI.show('Webcam API unavailable in this browser context.', 'error');
          return;
        }
        try {
          btn.disabled = true;
          btn.textContent = 'Recording 4.0s Live Feed...';
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          prev.srcObject = stream;
          prev.classList.remove('hidden');
          ph.classList.add('hidden');
          dot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping';

          const chunks = [];
          const mime = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
          const rec = new MediaRecorder(stream, { mimeType: mime });
          rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
          rec.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            prev.classList.add('hidden');
            ph.classList.remove('hidden');
            dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-600';
            btn.disabled = false;
            btn.textContent = 'Capture 4s Live Feed';
            const ext = mime.includes('mp4') ? 'mp4' : 'webm';
            const file = new File([new Blob(chunks, { type: mime })], `webcam-live-${Date.now()}.${ext}`, { type: mime });
            this.processFile(file);
          };
          rec.start();
          setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, 4000);
        } catch (_) {
          btn.disabled = false;
          btn.textContent = 'Capture 4s Live Feed';
          ToastUI.show('Camera permission denied or unavailable.', 'error');
        }
      },

      async generateSample(mode) {
        ToastUI.show(`Synthesizing ${mode} test stream...`, 'info');
        const c = document.createElement('canvas');
        c.width = 320; c.height = 180;
        const ctx = c.getContext('2d');
        const stream = c.captureStream(15);
        const aCtx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = aCtx.createMediaStreamDestination();
        const osc = aCtx.createOscillator();
        const gain = aCtx.createGain();
        osc.frequency.value = 185; gain.gain.value = 0.08;
        osc.connect(gain); gain.connect(dest); osc.start();

        const combined = new MediaStream([...stream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
        const chunks = [];
        const rec = new MediaRecorder(combined);
        rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

        let frame = 0;
        const iv = setInterval(() => {
          frame++;
          if (mode === 'anime') {
            // Cel-shaded cartoon background & crisp ink-outlined fictional character
            ctx.fillStyle = '#38BDF8'; ctx.fillRect(0, 0, 320, 110);
            ctx.fillStyle = '#0284C7'; ctx.fillRect(0, 110, 320, 70);
            ctx.fillStyle = '#FDE68A';
            ctx.beginPath(); ctx.ellipse(160, 92, 48, 56, 0, 0, Math.PI * 2); ctx.fill();
            ctx.lineWidth = 4; ctx.strokeStyle = '#090D16'; ctx.stroke();
            // Spiky cel-shaded hair
            ctx.fillStyle = '#8B5CF6';
            ctx.beginPath();
            ctx.moveTo(108, 72); ctx.lineTo(130, 18); ctx.lineTo(155, 42);
            ctx.lineTo(175, 14); ctx.lineTo(212, 72); ctx.closePath();
            ctx.fill(); ctx.stroke();
            // Large anime eyes
            ctx.fillStyle = '#EC4899';
            ctx.beginPath(); ctx.ellipse(142, 86, 8, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(178, 86, 8, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            gain.gain.value = 0.12;
          } else {
            ctx.fillStyle = '#0F172A'; ctx.fillRect(0, 0, 320, 180);
            const flk = (mode === 'manipulated' && frame % 6 === 0) ? 55 : 0;
            ctx.fillStyle = `rgb(${215 - flk}, ${165 - flk}, ${140 - flk})`;
            ctx.beginPath(); ctx.ellipse(160, 88, 46, 58, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1E293B';
            ctx.beginPath(); ctx.arc(143, 75, 4, 0, Math.PI * 2); ctx.arc(177, 75, 4, 0, Math.PI * 2); ctx.fill();

            if (mode === 'manipulated') {
              gain.gain.value = (frame % 6 < 3) ? 0.25 : 0.0;
              ctx.fillStyle = '#7F1D1D'; ctx.fillRect(148, 112, 24, 3);
            } else {
              const open = Math.abs(Math.sin(frame * 0.45)) * 11;
              gain.gain.value = (open / 11) * 0.2;
              ctx.fillStyle = '#7F1D1D';
              ctx.beginPath(); ctx.ellipse(160, 114, 12, 2 + open * 0.5, 0, 0, Math.PI * 2); ctx.fill();
            }
          }
        }, 66);

        rec.onstop = async () => {
          clearInterval(iv); osc.stop(); await aCtx.close();
          const f = new File([new Blob(chunks, { type: 'video/webm' })], `sample-${mode}-clip.webm`, { type: 'video/webm' });
          this.processFile(f);
        };
        rec.start();
        setTimeout(() => rec.stop(), 2400);
      }
    };

    /*************************************************************************
     * MODULE 7: AudioForensics — Multi-Window FFT & 2D STFT Spectrogram
     *************************************************************************/
    const AudioForensics = {
      micRecorder: null,
      micChunks: [],
      micInterval: null,

      handleUpload(e) {
        const file = e.target.files[0];
        if (file) this.processFile(file);
      },

      async processFile(file) {
        if (!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|mp4|aac|ogg|webm)$/i.test(file.name)) {
          ToastUI.show('Unsupported audio format. Use MP3, WAV, M4A, MP4, AAC, or OGG.', 'error');
          return;
        }

        try {
          const arrayBuf = await file.arrayBuffer();
          const sha256 = await CryptoMeta.sha256Buffer(arrayBuf);
          const metadata = CryptoMeta.inspectBinaryMetadata(arrayBuf, file.name, file.type);

          const url = URL.createObjectURL(file);
          document.getElementById('audio-player').src = url;

          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const decoded = await audioCtx.decodeAudioData(arrayBuf.slice(0));
          const sampleRate = decoded.sampleRate;
          const pcm = decoded.getChannelData(0);
          const duration = decoded.duration;
          await audioCtx.close();

          // 1. Multi-Window (Start 15%, Middle 50%, End 85%) 2048-pt Hann FFT Analysis
          const fftSize = 2048;
          const windowCenters = [0.15, 0.50, 0.85];
          const cutoffBin = Math.floor((7500 / (sampleRate / 2)) * (fftSize / 2));

          let flatSum = 0, highRatioSum = 0;
          windowCenters.forEach(pos => {
            const start = Math.max(0, Math.min(pcm.length - fftSize, Math.floor(pcm.length * pos) - fftSize / 2));
            const seg = new Float32Array(fftSize);
            for (let i = 0; i < fftSize && start + i < pcm.length; i++) {
              const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
              seg[i] = pcm[start + i] * w;
            }
            const mags = this.computeFFT(seg);
            let logS = 0, linS = 0, lowE = 0, highE = 0;
            for (let k = 1; k < mags.length; k++) {
              const m = Math.max(mags[k], 1e-10);
              logS += Math.log(m);
              linS += m;
              if (k < cutoffBin) lowE += m;
              else highE += m;
            }
            const bins = Math.max(mags.length - 1, 1);
            flatSum += Math.exp(logS / bins) / Math.max(linS / bins, 1e-10);
            highRatioSum += highE / Math.max(lowE + highE, 1e-10);
          });

          const spectralFlatness = flatSum / windowCenters.length;
          const highFreqRatio = highRatioSum / windowCenters.length;

          // 2. Frame-level RMS & Pitch/ZCR Stability
          const hop = 2048;
          const numFrames = Math.max(1, Math.floor(pcm.length / hop));
          const rmsArr = [], zcrArr = [], anomalies = [];
          for (let f = 0; f < numFrames; f++) {
            let sq = 0, zc = 0;
            const off = f * hop;
            for (let i = 0; i < hop && off + i < pcm.length; i++) {
              const s = pcm[off + i];
              sq += s * s;
              if (i > 0 && ((s >= 0 && pcm[off + i - 1] < 0) || (s < 0 && pcm[off + i - 1] >= 0))) zc++;
            }
            rmsArr.push(Math.sqrt(sq / hop));
            zcrArr.push(zc / hop);
          }

          const meanRms = rmsArr.reduce((a, b) => a + b, 0) / numFrames;
          const stdRms = Math.sqrt(rmsArr.reduce((a, b) => a + Math.pow(b - meanRms, 2), 0) / numFrames);
          const rmsCv = meanRms > 0 ? stdRms / meanRms : 0;

          const meanZcr = zcrArr.reduce((a, b) => a + b, 0) / numFrames;
          const stdZcr = Math.sqrt(zcrArr.reduce((a, b) => a + Math.pow(b - meanZcr, 2), 0) / numFrames);

          for (let f = 1; f < numFrames; f++) {
            if (Math.abs(zcrArr[f] - zcrArr[f - 1]) > 0.14) {
              anomalies.push({
                ratio: f / numFrames,
                time: (f / numFrames) * duration,
                timeFormatted: CryptoMeta.formatTimeSec((f / numFrames) * duration),
                reason: 'Pitch / Zero-Crossing phase discontinuity'
              });
            }
          }

          let synthScore = 0;
          if (highFreqRatio < 0.015) synthScore += 32;
          if (spectralFlatness < 0.04 || spectralFlatness > 0.58) synthScore += 28;
          if (rmsCv < 0.34) synthScore += 24;
          if (stdZcr < 0.025) synthScore += 16;
          if (metadata.detectedAI.length > 0) synthScore += 35;
          synthScore = Math.min(96, Math.round(synthScore));

          let verdict = 'Likely Authentic Voice';
          if (duration < 0.9 || meanRms < 0.003) verdict = 'Inconclusive';
          else if (synthScore >= 52) verdict = 'Likely AI-Generated Voice';
          else if (synthScore >= 32) verdict = 'Inconclusive';

          const risk = CryptoMeta.classifyFraudRisk(verdict, synthScore);

          const xaiFindings = [
            {
              name: 'Multi-Window High-Frequency Vocoder Cutoff (>7.5 kHz)',
              badge: 'Signal DSP / Multi-Window FFT',
              region: `Start/Mid/End Windows (0 – ${(sampleRate / 2000).toFixed(1)} kHz)`,
              explanation: `Mean high-band energy ratio = ${(highFreqRatio * 100).toFixed(2)}%. ${highFreqRatio < 0.015 ? 'Sharp upper-band cutoff indicates neural vocoder upsampling.' : 'Natural broadband harmonic extension observed across all 3 windows.'}`
            },
            {
              name: 'Wiener Spectral Flatness & ZCR Stability',
              badge: 'Signal DSP / Multi-Window FFT',
              region: '3× 2048-pt Hann Windows',
              explanation: `Spectral flatness = ${spectralFlatness.toFixed(4)}, ZCR σ = ${stdZcr.toFixed(3)}. ${spectralFlatness < 0.04 ? 'Over-periodic harmonic regularity typical of synthetic TTS.' : 'Organic vocal tract formant variance preserved.'}`
            },
            {
              name: 'Amplitude Cadence & Container Metadata',
              badge: 'Cryptographic / Metadata',
              region: `Duration ${CryptoMeta.formatTimeSec(duration)}`,
              explanation: `Dynamic RMS CV = ${rmsCv.toFixed(2)}. C2PA Status: ${metadata.c2paStatus}.`
            }
          ];

          const record = {
            id: CryptoMeta.generateAnalysisId(),
            timestamp: new Date().toISOString(),
            modality: 'Voice',
            fileName: file.name,
            fileSize: CryptoMeta.formatBytes(file.size),
            sha256,
            verdict,
            signalScore: synthScore,
            riskTier: risk.tier,
            riskBadgeClass: risk.badgeClass,
            recommendations: risk.recommendations,
            audioMetrics: {
              sampleRate: `${(sampleRate / 1000).toFixed(1)} kHz`,
              spectralFlatness: spectralFlatness.toFixed(3),
              highFreqPct: `${(highFreqRatio * 100).toFixed(2)}%`,
              rmsCv: rmsCv.toFixed(2)
            },
            suspiciousTimestamps: anomalies.slice(0, 6),
            xaiFindings,
            metadata
          };

          HistoryStore.saveRecord(record);
          this.renderResults(record, pcm, sampleRate, anomalies);
          ToastUI.show(`Voice analysis complete: ${verdict}`, verdict === 'Likely AI-Generated Voice' ? 'warn' : 'success');
        } catch (err) {
          ToastUI.show(err.message || 'Could not decode audio file.', 'error');
        }
      },

      renderResults(record, pcm, sampleRate, anomalies) {
        document.getElementById('audio-results-container').classList.remove('hidden');
        const m = record.audioMetrics;
        document.getElementById('audio-metrics-grid').innerHTML = `
          <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800"><p class="text-[10px] font-mono text-slate-400">SAMPLE RATE</p><p class="text-sm font-bold text-white mt-0.5">${m.sampleRate}</p></div>
          <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800"><p class="text-[10px] font-mono text-slate-400">SPECTRAL FLATNESS</p><p class="text-sm font-bold text-purple-300 mt-0.5">${m.spectralFlatness}</p></div>
          <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800"><p class="text-[10px] font-mono text-slate-400">HIGH-FREQ (&gt;7.5kHz)</p><p class="text-sm font-bold text-cyan-300 mt-0.5">${m.highFreqPct}</p></div>
          <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800"><p class="text-[10px] font-mono text-slate-400">CADENCE CV</p><p class="text-sm font-bold text-emerald-300 mt-0.5">${m.rmsCv}</p></div>
        `;

        this.drawDualWaveformAndSpectrogram(pcm, sampleRate, anomalies);
        document.getElementById('audio-verdict-panel').innerHTML = PDFExport.buildVerdictHTML(record);
      },

      // Renders Top Half: Amplitude Waveform + Bottom Half: 2D STFT Spectrogram with Band Markers
      drawDualWaveformAndSpectrogram(pcm, sampleRate, anomalies) {
        const canvas = document.getElementById('audio-spectrogram-canvas');
        if (!canvas || !pcm) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(480, Math.floor(rect.width * dpr));
        canvas.height = Math.max(240, Math.floor(rect.height * dpr));
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        const waveH = Math.floor(h * 0.42);
        const specY = waveH + 4;
        const specH = h - specY;

        ctx.fillStyle = '#040812';
        ctx.fillRect(0, 0, w, h);

        // 1. Top Waveform
        anomalies.forEach(a => {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
          ctx.fillRect(a.ratio * w - 12, 0, 24, waveH);
        });

        const step = Math.max(1, Math.floor(pcm.length / w));
        const amp = waveH * 0.44;
        for (let x = 0; x < w; x++) {
          let min = 1, max = -1;
          const st = x * step;
          for (let j = 0; j < step && st + j < pcm.length; j++) {
            const v = pcm[st + j];
            if (v < min) min = v;
            if (v > max) max = v;
          }
          ctx.fillStyle = '#00D2FF';
          ctx.fillRect(x, (1 + min) * amp + waveH * 0.06, 1.5, Math.max(2, (max - min) * amp));
        }

        // Divider line
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.beginPath(); ctx.moveTo(0, waveH + 2); ctx.lineTo(w, waveH + 2); ctx.stroke();

        // 2. Bottom 2D STFT Spectrogram (Time x Frequency up to 12 kHz)
        const cols = Math.min(140, Math.floor(w / 3));
        const colW = w / cols;
        const fftN = 512;
        const nyquist = sampleRate / 2;
        const maxDisplayHz = Math.min(12000, nyquist);
        const maxBin = Math.max(16, Math.floor((maxDisplayHz / nyquist) * (fftN / 2)));

        for (let c = 0; c < cols; c++) {
          const sampleStart = Math.floor((c / cols) * Math.max(0, pcm.length - fftN));
          const seg = new Float32Array(fftN);
          for (let i = 0; i < fftN && sampleStart + i < pcm.length; i++) {
            const win = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftN - 1)));
            seg[i] = pcm[sampleStart + i] * win;
          }
          const mags = this.computeFFT(seg);
          const binH = specH / maxBin;

          for (let b = 0; b < maxBin; b++) {
            const db = Math.max(0, Math.min(1, (Math.log10(mags[b] + 1e-4) + 2.5) / 3.5));
            const r = Math.round(db > 0.55 ? (db - 0.55) * 560 : 12);
            const g = Math.round(db > 0.25 ? db * 220 : 20);
            const bl = Math.round(60 + (1 - Math.abs(db - 0.45)) * 195);
            ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, bl)})`;
            ctx.fillRect(c * colW, specY + specH - (b + 1) * binH, Math.ceil(colW), Math.ceil(binH));
          }
        }

        // Frequency Band Markers (4.0 kHz and 7.5 kHz vocoder cutoff line)
        const y4k = specY + specH - (4000 / maxDisplayHz) * specH;
        const y75k = specY + specH - (Math.min(7500, maxDisplayHz) / maxDisplayHz) * specH;

        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.75)';
        ctx.beginPath(); ctx.moveTo(0, y4k); ctx.lineTo(w, y4k); ctx.stroke();

        ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
        ctx.beginPath(); ctx.moveTo(0, y75k); ctx.lineTo(w, y75k); ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.fillStyle = '#00D2FF';
        ctx.fillText('4.0 kHz (Speech Band)', 8, y4k - 4);
        ctx.fillStyle = '#FDA4AF';
        ctx.fillText('7.5 kHz (Vocoder Cutoff Zone)', 8, Math.max(specY + 13, y75k - 4));

        canvas.onclick = (e) => {
          const r = canvas.getBoundingClientRect();
          const ratio = (e.clientX - r.left) / r.width;
          const p = document.getElementById('audio-player');
          if (p && isFinite(p.duration)) {
            p.currentTime = ratio * p.duration;
            p.play().catch(() => {});
          }
        };
      },

      computeFFT(signal) {
        const n = signal.length;
        const real = new Float32Array(signal);
        const imag = new Float32Array(n);
        let j = 0;
        for (let i = 0; i < n; i++) {
          if (i < j) [real[i], real[j]] = [real[j], real[i]];
          let m = n >> 1;
          while (m >= 1 && j >= m) { j -= m; m >>= 1; }
          j += m;
        }
        for (let s = 1; s <= Math.log2(n); s++) {
          const m = 1 << s, halfM = m >> 1;
          const theta = (-2 * Math.PI) / m;
          const wStepR = Math.cos(theta), wStepI = Math.sin(theta);
          for (let k = 0; k < n; k += m) {
            let wR = 1, wI = 0;
            for (let j2 = 0; j2 < halfM; j2++) {
              const tR = wR * real[k + j2 + halfM] - wI * imag[k + j2 + halfM];
              const tI = wR * imag[k + j2 + halfM] + wI * real[k + j2 + halfM];
              real[k + j2 + halfM] = real[k + j2] - tR;
              imag[k + j2 + halfM] = imag[k + j2] - tI;
              real[k + j2] += tR;
              imag[k + j2] += tI;
              const nWR = wR * wStepR - wI * wStepI;
              wI = wR * wStepI + wI * wStepR;
              wR = nWR;
            }
          }
        }
        const mags = new Float32Array(n / 2);
        for (let i = 0; i < n / 2; i++) mags[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
        return mags;
      },

      async toggleMicRecording() {
        const btn = document.getElementById('mic-record-btn');
        const statusText = document.getElementById('mic-status-text');
        const timerEl = document.getElementById('mic-timer');

        if (this.micRecorder && this.micRecorder.state === 'recording') {
          this.micRecorder.stop();
          return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          ToastUI.show('Microphone recording is not supported in this browser.', 'error');
          return;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.micChunks = [];

          // Cross-browser MIME selection (Chrome/Edge webm vs macOS Safari mp4)
          const preferredMimes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
          const supportedMime = preferredMimes.find(m => MediaRecorder.isTypeSupported(m)) || '';
          const rec = supportedMime ? new MediaRecorder(stream, { mimeType: supportedMime }) : new MediaRecorder(stream);
          this.micRecorder = rec;

          let sec = 0;
          timerEl.textContent = '00:00';
          statusText.textContent = 'Recording live voice... Click again to stop & analyze';
          btn.textContent = 'Stop & Analyze Voice';
          btn.className = 'w-full py-2.5 rounded-xl bg-rose-600/30 border border-rose-400 text-rose-200 text-xs font-semibold animate-pulse';

          this.micInterval = setInterval(() => {
            sec++;
            timerEl.textContent = CryptoMeta.formatTimeSec(sec);
            if (sec >= 15 && rec.state === 'recording') rec.stop();
          }, 1000);

          rec.ondataavailable = e => { if (e.data.size > 0) this.micChunks.push(e.data); };
          rec.onstop = () => {
            clearInterval(this.micInterval);
            stream.getTracks().forEach(t => t.stop());
            btn.textContent = 'Start Microphone Recording';
            btn.className = 'w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold transition';
            statusText.textContent = 'Captured. Running STFT & spectral forensics...';

            const finalMime = rec.mimeType || supportedMime || 'audio/webm';
            const ext = finalMime.includes('mp4') ? 'm4a' : 'webm';
            const file = new File([new Blob(this.micChunks, { type: finalMime })], `mic-capture-${Date.now()}.${ext}`, { type: finalMime });
            this.processFile(file);
          };
          rec.start();
        } catch (_) {
          ToastUI.show('Microphone permission denied or unavailable.', 'error');
        }
      },

      generateSample(mode) {
        const sr = 44100, dur = 3.0, n = sr * dur;
        const buf = new ArrayBuffer(44 + n * 2);
        const v = new DataView(buf);
        const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
        ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
        v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
        v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
        ws(36, 'data'); v.setUint32(40, n * 2, true);

        for (let i = 0; i < n; i++) {
          const t = i / sr;
          let s = 0;
          if (mode === 'synthetic') {
            s = 0.42 * (Math.sin(2 * Math.PI * 165 * t) + 0.45 * Math.sin(2 * Math.PI * 330 * t));
          } else {
            const env = Math.max(0, Math.sin(2 * Math.PI * 2.4 * t)) * (t > 1.35 && t < 1.75 ? 0.03 : 1.0);
            const f0 = 145 + 14 * Math.sin(2 * Math.PI * 5.2 * t);
            s = env * 0.45 * (Math.sin(2 * Math.PI * f0 * t) + 0.5 * Math.sin(2 * Math.PI * f0 * 2 * t) + 0.14 * Math.sin(2 * Math.PI * 9200 * t));
          }
          v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 32767, true);
        }
        this.processFile(new File([buf], `sample-${mode}-voice.wav`, { type: 'audio/wav' }));
      }
    };

    /*************************************************************************
     * MODULE 8: ImageForensics — Before/After Split ELA Slider + Detectra
     *************************************************************************/
    const ImageForensics = {
      origCanvas: null,
      recompCanvas: null,
      pureElaCanvas: null,

      handleUpload(e) {
        const file = e.target.files[0];
        if (file) this.processFile(file);
      },

      async processFile(file) {
        if (!file.type.startsWith('image/') && !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
          ToastUI.show('Please upload a JPG, JPEG, PNG, or WEBP image.', 'error');
          return;
        }

        try {
          const arrayBuf = await file.arrayBuffer();
          const sha256 = await CryptoMeta.sha256Buffer(arrayBuf);
          const metadata = CryptoMeta.inspectBinaryMetadata(arrayBuf, file.name, file.type);

          const imgUrl = URL.createObjectURL(file);
          const img = new Image();
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = imgUrl; });

          const scale = Math.min(1, 640 / Math.max(img.width, img.height));
          const w = Math.max(32, Math.round(img.width * scale));
          const h = Math.max(32, Math.round(img.height * scale));

          const origCanvas = document.createElement('canvas');
          origCanvas.width = w; origCanvas.height = h;
          origCanvas.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, w, h);

          // 90% JPEG Recompression for Error Level Analysis
          const recompUrl = origCanvas.toDataURL('image/jpeg', 0.90);
          const recompImg = new Image();
          await new Promise(res => { recompImg.onload = res; recompImg.src = recompUrl; });

          const recompCanvas = document.createElement('canvas');
          recompCanvas.width = w; recompCanvas.height = h;
          recompCanvas.getContext('2d', { willReadFrequently: true }).drawImage(recompImg, 0, 0, w, h);

          this.origCanvas = origCanvas;
          this.recompCanvas = recompCanvas;

          const stats = this.recomputeElaBoost(false);

          // Check for Anime, 2D/3D Cartoon, CGI Render, or Fictional Character
          const artCheck = await SyntheticArtDetector.analyzeCanvas(origCanvas);
          WorkerML.setStatusPill('Loading Detectra v3 image model (43.7 MB)...', 'cyan');
          const modelResult = await WorkerML.callWorker('DETECT_AI_IMAGE', { file }, 120000);
          const aiGenScore = modelResult.ok ? Math.round(modelResult.data.score * 100) : null;
          WorkerML.imageModelAvailable = modelResult.ok;
          if (modelResult.ok) WorkerML.setStatusPill(`Image model: Detectra v3 (${modelResult.data.device.toUpperCase()})`, 'emerald');
          else WorkerML.setStatusPill('Image model unavailable • local signals still work', 'amber');
          const imageModelBadge = modelResult.ok
            ? `Detectra v3 · ${modelResult.data.device.toUpperCase()}`
            : 'Detectra v3 unavailable';

          let manipulationScore = 0; // Localized splicing / face-swap
          // The model score is separate from localized compression and metadata signals.

          if (stats.elaSpatialRatio > 2.35 && (stats.maxCellEla - stats.minCellEla) > 3.2) manipulationScore += 46;
          else if (stats.elaSpatialRatio > 1.75) manipulationScore += 24;
          if (metadata.detectedEditors.length > 0) manipulationScore += 22;

          manipulationScore = Math.min(96, Math.round(manipulationScore));
          const combinedScore = Math.max(manipulationScore, aiGenScore || 0);

          let verdict = 'Inconclusive';
          if (manipulationScore >= 46) verdict = 'Likely Manipulated';
          else if (aiGenScore !== null && aiGenScore >= 65) verdict = 'Likely AI-Generated Media';
          else if (aiGenScore !== null && aiGenScore < 45 && manipulationScore < 26) verdict = 'Likely Authentic';

          let risk = CryptoMeta.classifyFraudRisk(verdict, combinedScore);

          const xaiFindings = [
            {
              name: 'Localized Manipulation & Face-Swap Check (90% JPEG ELA)',
              badge: 'ELA Compression Matrix',
              region: '8×8 Spatial Recompression Grid',
              explanation: `Global ELA mean=${stats.globalMeanEla.toFixed(2)}, Peak Grid Ratio=${stats.elaSpatialRatio.toFixed(2)}x. ${stats.elaSpatialRatio > 2.0 ? 'High localized ELA disparity indicates possible splicing or face-swap retouching.' : 'Consistent JPEG quantization response across image blocks.'}`
            },
            {
              name: 'AI-Generated Image Classifier',
              badge: imageModelBadge,
              region: `${w}×${h} Pixel Matrix`,
              explanation: aiGenScore === null
                ? `The optional image model did not run (${modelResult.error || 'model unavailable'}). Local ELA and metadata signals are still available; the AI-image result is unknown.`
                : `Detectra v3 model score=${aiGenScore}/100 (its model-card decision threshold is 65/100). This score is not a calibrated probability and does not prove image generation. Localized compression score=${manipulationScore}/100.`
            },
            {
              name: 'EXIF Camera Fields & C2PA Content Credentials',
              badge: 'Cryptographic / Metadata',
              region: 'Binary Header / XMP / JUMBF',
              explanation: `EXIF=${metadata.hasExif ? 'Present' : 'Absent'}, Camera=${metadata.detectedCameras.join(', ') || 'None'}, Date=${metadata.exifDate}, C2PA=${metadata.c2paStatus}.`
            }
          ];

          // Keep visual style separate from evidence of generation or manipulation.
          if (artCheck.isSyntheticArt) {
            xaiFindings.unshift(artCheck.xaiFinding);
          }

          const record = {
            id: CryptoMeta.generateAnalysisId(),
            timestamp: new Date().toISOString(),
            modality: 'Image',
            fileName: file.name,
            fileSize: CryptoMeta.formatBytes(file.size),
            sha256,
            verdict,
            signalScore: combinedScore,
            manipulationScore,
            aiGenScore,
            riskTier: risk.tier,
            riskBadgeClass: risk.badgeClass,
            recommendations: risk.recommendations,
            xaiFindings,
            metadata
          };

          HistoryStore.saveRecord(record);
          this.renderResults(record);
          ToastUI.show(`Image ELA & metadata scan complete: ${verdict}`, (verdict.includes('Manipulated') || verdict.includes('AI-Generated')) ? 'warn' : 'success');
        } catch (err) {
          ToastUI.show(err.message || 'Image forensic analysis failed.', 'error');
        }
      },

      recomputeElaBoost(renderAfter = true) {
        if (!this.origCanvas || !this.recompCanvas) return null;
        const w = this.origCanvas.width, h = this.origCanvas.height;
        const origData = this.origCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
        const recompData = this.recompCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;

        const boostSlider = document.getElementById('ela-boost-slider');
        const boost = boostSlider ? Number(boostSlider.value) : 16;
        if (document.getElementById('ela-boost-val')) document.getElementById('ela-boost-val').textContent = `${boost}x`;

        const pure = document.createElement('canvas');
        pure.width = w; pure.height = h;
        const pCtx = pure.getContext('2d');
        const out = pCtx.createImageData(w, h);

        const cols = 8, rows = 8;
        const cellSums = new Float64Array(cols * rows);
        const cellCounts = new Uint32Array(cols * rows);
        let totalErr = 0, gradSum = 0;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const err = (Math.abs(origData[idx] - recompData[idx]) + Math.abs(origData[idx + 1] - recompData[idx + 1]) + Math.abs(origData[idx + 2] - recompData[idx + 2])) / 3;
            totalErr += err;

            const gIdx = Math.min(rows - 1, Math.floor((y / h) * rows)) * cols + Math.min(cols - 1, Math.floor((x / w) * cols));
            cellSums[gIdx] += err;
            cellCounts[gIdx]++;

            if (x > 0 && y > 0) gradSum += Math.abs(origData[idx] - origData[idx - 4]);

            const amp = Math.min(255, err * boost);
            let hr = 8, hg = 20 + amp, hb = 80 + amp * 2;
            if (amp >= 64 && amp < 140) { hr = 0; hg = 150 + (amp - 64); hb = 255 - (amp - 64); }
            else if (amp >= 140 && amp < 205) { hr = (amp - 140) * 3.8; hg = 230; hb = 40; }
            else if (amp >= 205) { hr = 255; hg = Math.max(0, 220 - (amp - 205) * 4); hb = 40; }

            out.data[idx] = hr; out.data[idx + 1] = hg; out.data[idx + 2] = hb; out.data[idx + 3] = 255;
          }
        }
        pCtx.putImageData(out, 0, 0);
        this.pureElaCanvas = pure;
        if (renderAfter) this.renderSplitComposite();

        const means = Array.from(cellSums).map((s, i) => s / Math.max(cellCounts[i], 1));
        const globalMeanEla = totalErr / (w * h);
        const maxCellEla = Math.max(...means);
        const minCellEla = Math.min(...means);
        return {
          globalMeanEla,
          maxCellEla,
          minCellEla,
          elaSpatialRatio: globalMeanEla > 0.05 ? maxCellEla / globalMeanEla : 1.0,
          avgPixelGradient: gradSum / Math.max((w - 1) * (h - 1), 1)
        };
      },

      // Renders Interactive Before/After Split Comparison Slider
      renderSplitComposite() {
        if (!this.origCanvas || !this.pureElaCanvas) return;
        const canvas = document.getElementById('image-ela-canvas');
        const w = this.origCanvas.width, h = this.origCanvas.height;
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');

        const splitPct = Number(document.getElementById('ela-split-slider').value);
        const opacityPct = Number(document.getElementById('ela-opacity-slider').value);
        document.getElementById('ela-split-val').textContent = `${splitPct}%`;
        document.getElementById('ela-opacity-val').textContent = `${opacityPct}%`;

        const splitX = Math.round((splitPct / 100) * w);

        // Draw Original Base
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(this.origCanvas, 0, 0);

        // Draw ELA Heatmap on Right Side of Split Line
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, w - splitX, h);
        ctx.clip();
        ctx.globalAlpha = opacityPct / 100;
        ctx.drawImage(this.pureElaCanvas, 0, 0);
        ctx.restore();

        // Draw Split Divider Line & Handle
        ctx.strokeStyle = '#00D2FF';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(splitX, 0); ctx.lineTo(splitX, h); ctx.stroke();

        ctx.fillStyle = '#00D2FF';
        ctx.beginPath(); ctx.arc(splitX, h / 2, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#030712';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⇄', splitX, h / 2 + 3.5);

        // Allow direct mouse/touch drag on canvas to move split divider
        const updateFromPointer = (clientX) => {
          const rect = canvas.getBoundingClientRect();
          const pct = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
          document.getElementById('ela-split-slider').value = pct;
          this.renderSplitComposite();
        };
        canvas.onpointerdown = (e) => {
          updateFromPointer(e.clientX);
          canvas.onpointermove = (ev) => { if (ev.buttons === 1) updateFromPointer(ev.clientX); };
        };
        canvas.onpointerup = () => { canvas.onpointermove = null; };
      },

      renderResults(record) {
        document.getElementById('image-results-container').classList.remove('hidden');
        this.renderSplitComposite();

        document.getElementById('image-dual-distinction').innerHTML = `
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/25">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-purple-300">1. AI-Image Model Score</span>
              <span class="font-mono font-bold text-white">${record.aiGenScore == null ? 'Not run' : `${record.aiGenScore}/100`}</span>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-800 mt-2 overflow-hidden"><div class="h-full bg-purple-500" style="width:${record.aiGenScore ?? 0}%"></div></div>
            <p class="text-[11px] text-slate-400 mt-1.5">Detectra v3 · 65/100 review threshold · model score, not proof.</p>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/25">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-cyan-300">2. Localized Manipulation / Face-Swap</span>
              <span class="font-mono font-bold text-white">${record.manipulationScore}%</span>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-800 mt-2 overflow-hidden"><div class="h-full bg-cyan-400" style="width:${record.manipulationScore}%"></div></div>
            <p class="text-[11px] text-slate-400 mt-1.5">90% JPEG ELA recompression grid disparities &amp; splicing.</p>
          </div>
        `;

        document.getElementById('image-verdict-panel').innerHTML = PDFExport.buildVerdictHTML(record);
      },

      generateSample(mode) {
        const c = document.createElement('canvas');
        c.width = 480; c.height = 320;
        const ctx = c.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 480, 320);
        g.addColorStop(0, '#1E293B'); g.addColorStop(1, '#334155');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 320);

        for (let y = 0; y < 320; y += 2) {
          for (let x = 0; x < 480; x += 2) {
            const gr = ((x * 17 + y * 31) % 19) - 9;
            ctx.fillStyle = `rgba(${120 + gr},${140 + gr},${165 + gr},0.28)`;
            ctx.fillRect(x, y, 2, 2);
          }
        }

        if (mode === 'spliced') {
          ctx.fillStyle = '#F43F5E'; ctx.fillRect(150, 75, 180, 165);
          ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 17px JetBrains Mono, monospace';
          ctx.fillText('SPLICED REGION', 168, 162);
          c.toBlob(async blob => {
            const base = await blob.arrayBuffer();
            const tag = new TextEncoder().encode('Software: Midjourney v6 // ComfyUI');
            const out = new Uint8Array(base.byteLength + tag.byteLength);
            out.set(new Uint8Array(base), 0); out.set(tag, base.byteLength);
            this.processFile(new File([out], 'sample-spliced-ai.png', { type: 'image/png' }));
          }, 'image/png');
        } else if (mode === 'anime') {
          // Flat cel-shaded sky & stylized anime character with crisp dark ink outlines
          ctx.fillStyle = '#0EA5E9'; ctx.fillRect(0, 0, 480, 210);
          ctx.fillStyle = '#38BDF8'; ctx.fillRect(0, 210, 480, 110);
          // Character face (flat cel fill + crisp ink outline)
          ctx.fillStyle = '#FDE68A';
          ctx.beginPath(); ctx.ellipse(240, 175, 76, 92, 0, 0, Math.PI * 2); ctx.fill();
          ctx.lineWidth = 5; ctx.strokeStyle = '#090D16'; ctx.stroke();
          // Stylized anime hair spikes
          ctx.fillStyle = '#7C3AED';
          ctx.beginPath();
          ctx.moveTo(155, 145); ctx.lineTo(185, 45); ctx.lineTo(225, 92);
          ctx.lineTo(255, 38); ctx.lineTo(325, 145); ctx.closePath();
          ctx.fill(); ctx.stroke();
          // Large vibrant anime eyes
          ctx.fillStyle = '#EC4899';
          ctx.beginPath(); ctx.ellipse(210, 165, 14, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(270, 165, 14, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(206, 158, 5, 0, Math.PI * 2); ctx.arc(266, 158, 5, 0, Math.PI * 2); ctx.fill();
          c.toBlob(blob => {
            this.processFile(new File([blob], 'sample-anime-character.png', { type: 'image/png' }));
          }, 'image/png');
        } else {
          ctx.fillStyle = '#0EA5E9'; ctx.beginPath(); ctx.arc(240, 160, 70, 0, Math.PI * 2); ctx.fill();
          c.toBlob(async blob => {
            const base = await blob.arrayBuffer();
            const tag = new TextEncoder().encode('Exif Make: Canon EOS R6 // 2026:11:24 19:00:00');
            const out = new Uint8Array(base.byteLength + tag.byteLength);
            out.set(new Uint8Array(base), 0); out.set(tag, base.byteLength);
            this.processFile(new File([out], 'sample-camera-natural.jpg', { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.92);
        }
      }
    };

    /*************************************************************************
     * MODULE 9: DocLinkForensics — PDF.js + Mammoth.js + Stylometry + URLs
     *************************************************************************/
    const DocLinkForensics = {
      loadSampleText() {
        document.getElementById('doc-text-input').value =
          "In the rapidly evolving landscape of digital communications, synthetic media presents multifaceted challenges for enterprise security. Furthermore, the proliferation of generative architectures necessitates comprehensive verification protocols across modern workflows. Furthermore, stakeholders must implement robust cryptographic standards to safeguard institutional integrity. Moreover, continuous monitoring and proactive governance remain paramount for mitigating emerging cyber threats across global networks.";
        ToastUI.show('Loaded sample AI-patterned prose. Click Run Stylometry to inspect.', 'info');
      },

      async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();

        try {
          const arrayBuf = await file.arrayBuffer();
          const sha256 = await CryptoMeta.sha256Buffer(arrayBuf);
          const metadata = CryptoMeta.inspectBinaryMetadata(arrayBuf, file.name, file.type);
          let extractedText = '';

          if (ext === 'pdf' && window.pdfjsLib) {
            ToastUI.show('Parsing PDF document pages via PDF.js...', 'info');
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuf.slice(0) }).promise;
            const maxPages = Math.min(pdf.numPages, 25);
            const parts = [];
            for (let p = 1; p <= maxPages; p++) {
              const page = await pdf.getPage(p);
              const content = await page.getTextContent();
              parts.push(content.items.map(it => it.str).join(' '));
            }
            extractedText = parts.join('\n');
          } else if (ext === 'docx' && window.mammoth) {
            ToastUI.show('Extracting Word .docx text via Mammoth.js...', 'info');
            const res = await window.mammoth.extractRawText({ arrayBuffer: arrayBuf.slice(0) });
            extractedText = res.value || '';
          } else {
            extractedText = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuf);
          }

          extractedText = extractedText.replace(/\s+/g, ' ').trim();
          document.getElementById('doc-text-input').value = extractedText.slice(0, 12000);
          this.evaluateText(extractedText, file.name, file.size, sha256, metadata);
        } catch (err) {
          ToastUI.show(`Document extraction error: ${err.message}`, 'error');
        }
      },

      async analyzeTextInput() {
        const text = document.getElementById('doc-text-input').value.trim();
        if (text.length < 40) {
          ToastUI.show('Enter or upload at least 40 characters of text.', 'warn');
          return;
        }
        const sha256 = await CryptoMeta.sha256String(text);
        const metadata = {
          fileName: 'Direct-Text-Submission.txt',
          mimeType: 'text/plain',
          c2paStatus: 'Plain Text Stream (No Binary Container)',
          detectedAI: [],
          detectedEditors: []
        };
        this.evaluateText(text, 'Direct-Text-Submission.txt', new Blob([text]).size, sha256, metadata);
      },

      evaluateText(text, fileName, fileSize, sha256, metadata) {
        const words = text.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
        const rawSentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 3);

        if (words.length < 25 || rawSentences.length < 2) {
          ToastUI.show('Insufficient structured sentences for stylometric scoring (need 25+ words).', 'warn');
          return;
        }

        // 1. Sentence-Length Burstiness (Standard Deviation)
        const sentLengths = rawSentences.map(s => s.split(/\s+/).length);
        const meanLen = sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length;
        const burstinessStd = Math.sqrt(sentLengths.reduce((a, b) => a + Math.pow(b - meanLen, 2), 0) / sentLengths.length);

        // 2. Type-Token Lexical Diversity (TTR)
        const uniqueWords = new Set(words);
        const ttr = uniqueWords.size / words.length;

        // 3. Repetitive 3-Gram Transitions
        const trigramCounts = {};
        let repeatedTrigrams = 0;
        for (let i = 0; i <= words.length - 3; i++) {
          const tri = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
          trigramCounts[tri] = (trigramCounts[tri] || 0) + 1;
          if (trigramCounts[tri] === 2) repeatedTrigrams++;
        }

        // 4. Sentence-Starter Uniformity
        const starters = rawSentences.map(s => (s.toLowerCase().match(/^[a-z]+/) || [''])[0]);
        const uniqueStarters = new Set(starters).size;
        const starterUniformity = 1 - (uniqueStarters / rawSentences.length);

        const llmMarkers = ['furthermore', 'moreover', 'consequently', 'multifaceted', 'paramount', 'delve', 'landscape', 'testament', 'necessitates', 'underscore', 'comprehensive'];
        const markerHits = llmMarkers.filter(m => words.includes(m));

        // Score & flag individual uniform / AI-like sentences for highlighting
        const analyzedSentences = rawSentences.map(s => {
          const wCount = s.split(/\s+/).length;
          const lower = s.toLowerCase();
          const hasMarker = llmMarkers.some(m => lower.includes(m));
          const isUniformLen = Math.abs(wCount - meanLen) <= 2.2 && burstinessStd < 4.8;
          const starter = (lower.match(/^[a-z]+/) || [''])[0];
          const repeatedStarter = starters.filter(st => st === starter).length >= 2;
          const flagged = hasMarker || (isUniformLen && repeatedStarter);
          return { text: s, flagged, reason: hasMarker ? 'LLM discourse marker' : (isUniformLen ? 'Uniform cadence' : '') };
        });

        let aiScore = 0;
        if (burstinessStd < 4.2) aiScore += 34;
        else if (burstinessStd < 5.8) aiScore += 16;
        if (markerHits.length >= 2) aiScore += 30;
        else if (markerHits.length === 1) aiScore += 14;
        if (starterUniformity >= 0.35) aiScore += 18;
        if (repeatedTrigrams >= 2) aiScore += 14;
        if (metadata.detectedAI.length > 0) aiScore += 28;
        aiScore = Math.min(95, Math.round(aiScore));

        let verdict = 'Likely Human-Written';
        if (words.length < 35) verdict = 'Inconclusive';
        else if (aiScore >= 50) verdict = 'Likely AI-Generated Content';
        else if (aiScore >= 30) verdict = 'Inconclusive';

        const risk = CryptoMeta.classifyFraudRisk(verdict, aiScore);

        const xaiFindings = [
          {
            name: 'Sentence-Length Burstiness & Starter Uniformity',
            badge: 'Stylometry Engine',
            region: `${rawSentences.length} Sentences (Mean ${meanLen.toFixed(1)} words)`,
            explanation: `Burstiness σ = ${burstinessStd.toFixed(2)}, Starter Uniformity = ${(starterUniformity * 100).toFixed(0)}%. ${burstinessStd < 4.5 ? 'Low variance indicates uniform, machine-like syntactic rhythm.' : 'Natural structural rhythm variation observed.'}`
          },
          {
            name: 'Type-Token Diversity & 3-Gram Repetition',
            badge: 'Stylometry Engine',
            region: `${words.length} Tokens (${uniqueWords.size} Unique)`,
            explanation: `TTR = ${ttr.toFixed(2)}, Repeated 3-grams = ${repeatedTrigrams}, LLM Discourse Markers = ${markerHits.join(', ') || 'None'}.`
          },
          {
            name: 'Document Metadata & Producer Dictionary',
            badge: 'Cryptographic / Metadata',
            region: 'File Header / Stream',
            explanation: `C2PA/Metadata Status: ${metadata.c2paStatus}.`
          }
        ];

        const record = {
          id: CryptoMeta.generateAnalysisId(),
          timestamp: new Date().toISOString(),
          modality: 'Document',
          fileName,
          fileSize: CryptoMeta.formatBytes(fileSize),
          sha256,
          verdict,
          signalScore: aiScore,
          riskTier: risk.tier,
          riskBadgeClass: risk.badgeClass,
          recommendations: risk.recommendations,
          xaiFindings,
          metadata
        };

        HistoryStore.saveRecord(record);

        const highlightedHtml = `
          <div class="glass-card rounded-2xl p-5 space-y-3 border border-emerald-500/25">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-mono uppercase tracking-wider text-emerald-300">Sentence-Level Stylometry Highlight Map</h4>
              <span class="text-[11px] font-mono text-slate-400">Highlighted = Uniform Cadence / LLM Transition</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs leading-relaxed space-x-1">
              ${analyzedSentences.map(st => st.flagged
                ? `<span class="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200" title="${CryptoMeta.escapeHtml(st.reason)}">${CryptoMeta.escapeHtml(st.text)}</span>`
                : `<span class="text-slate-300">${CryptoMeta.escapeHtml(st.text)}</span>`
              ).join(' ')}
            </div>
          </div>
        `;

        const out = document.getElementById('doclink-results-container');
        out.classList.remove('hidden');
        out.innerHTML = highlightedHtml + PDFExport.buildVerdictHTML(record);
        ToastUI.show(`Document stylometry complete: ${verdict}`, 'success');
      },

      async analyzeUrl() {
        const rawUrl = document.getElementById('link-url-input').value.trim();
        if (!rawUrl) { ToastUI.show('Please enter a valid URL to verify.', 'warn'); return; }

        let parsed;
        try { parsed = new URL(rawUrl); } catch (_) { ToastUI.show('Invalid URL syntax. Include https:// or http://', 'error'); return; }

        const host = parsed.hostname.toLowerCase();
        const sha256 = await CryptoMeta.sha256String(rawUrl);
        const issues = [];

        if (parsed.protocol !== 'https:') issues.push('Insecure HTTP transport (Missing TLS encryption)');
        if (host.startsWith('xn--') || host.includes('.xn--')) issues.push('Punycode / IDN homograph domain encoding detected');
        if (/[01]/.test(host) && /(paypa1|g00gle|instagran|faceb00k|micros0ft|verify|secure)/i.test(host)) {
          issues.push('Lookalike digit-substitution spoofing pattern in hostname');
        }
        if (/\.(xyz|top|click|gq|tk|ml|zip)$/i.test(host)) issues.push('High-risk disposable TLD commonly abused in phishing lures');

        const redirectKeys = ['redirect', 'url', 'next', 'target', 'dest', 'goto'].filter(k => parsed.searchParams.has(k));
        if (redirectKeys.length > 0) issues.push(`Open redirect parameter(s) detected: ${redirectKeys.join(', ')}`);

        const trackingKeys = Array.from(parsed.searchParams.keys()).filter(k => k.startsWith('utm_') || k === 'igsh' || k === 'fbclid');

        let platform = 'External Domain';
        let isSocial = false;
        if (host.includes('instagram.com')) { platform = 'Instagram / Reel'; isSocial = true; }
        else if (host.includes('youtube.com') || host.includes('youtu.be')) { platform = 'YouTube / Shorts'; isSocial = true; }
        else if (host.includes('tiktok.com')) { platform = 'TikTok'; isSocial = true; }
        else if (host.includes('x.com') || host.includes('twitter.com')) { platform = 'X (Twitter)'; isSocial = true; }

        const urlScore = issues.length >= 2 ? 82 : issues.length === 1 ? 56 : 18;
        const verdict = issues.length > 0 ? 'Likely Manipulated' : 'Inconclusive';
        const risk = CryptoMeta.classifyFraudRisk(verdict, urlScore);

        const xaiFindings = [
          {
            name: 'URL Lexical, Homograph & Redirect Inspection',
            badge: 'URL Security Heuristic',
            region: host,
            explanation: `Platform: ${platform} | Protocol: ${parsed.protocol.toUpperCase()} | Tracking Params: ${trackingKeys.length}. ${issues.length > 0 ? issues.join(' • ') : 'No homograph, punycode, or open-redirect anomalies detected.'}`
          },
          {
            name: 'Browser CORS Media Stream Policy',
            badge: 'Browser Sandbox Policy',
            region: parsed.pathname || '/',
            explanation: isSocial
              ? `${platform} blocks cross-origin browser binary access (CORS). Download the MP4 Reel and upload it to the Video Detector for true landmark & lip-sync analysis.`
              : 'HTML webpage URLs cannot be pixel-scanned cross-origin without downloading the underlying media file.'
          }
        ];

        const record = {
          id: CryptoMeta.generateAnalysisId(),
          timestamp: new Date().toISOString(),
          modality: 'Link',
          fileName: rawUrl.slice(0, 68),
          fileSize: 'URL Reference',
          sha256,
          verdict,
          signalScore: urlScore,
          riskTier: risk.tier,
          riskBadgeClass: risk.badgeClass,
          recommendations: risk.recommendations,
          xaiFindings,
          metadata: { fileName: rawUrl, mimeType: 'text/uri-list', c2paStatus: 'URL Pointer Only (Requires Direct Binary File)' }
        };

        HistoryStore.saveRecord(record);
        const out = document.getElementById('doclink-results-container');
        out.classList.remove('hidden');
        out.innerHTML = PDFExport.buildVerdictHTML(record, isSocial ? `
          <div class="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p class="text-xs text-cyan-200">Downloaded the Reel MP4? Run 12-frame MediaPipe &amp; lip-sync verification:</p>
            <button onclick="UIController.navigateTo('video')" class="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs shrink-0">Open Video Detector →</button>
          </div>
        ` : '');
        ToastUI.show('URL security & homograph check complete.', 'info');
      }
    };

    /*************************************************************************
     * MODULE 10: Dashboard — Real-Time Session & Database Chart.js Analytics
     *************************************************************************/
    const Dashboard = {
      charts: { verdicts: null, modalities: null, risks: null },

      refresh() {
        const scans = HistoryStore.scans;
        const total = scans.length;
        const videoC = scans.filter(s => s.modality === 'Video').length;
        const voiceC = scans.filter(s => s.modality === 'Voice').length;
        const imageC = scans.filter(s => s.modality === 'Image').length;
        const manipC = scans.filter(s => s.verdict.includes('Manipulated') || s.verdict.includes('AI-Generated')).length;
        const authC = scans.filter(s => s.verdict.includes('Authentic') || s.verdict.includes('Human')).length;
        const incC = scans.filter(s => s.verdict === 'Inconclusive').length;

        document.getElementById('kpi-total').textContent = total;
        document.getElementById('kpi-video').textContent = videoC;
        document.getElementById('kpi-voice').textContent = voiceC;
        document.getElementById('kpi-image').textContent = imageC;
        document.getElementById('kpi-manipulated').textContent = manipC;
        document.getElementById('kpi-authentic').textContent = authC;
        document.getElementById('kpi-inconclusive').textContent = incC;

        const emptyEl = document.getElementById('dashboard-empty-state');
        const gridEl = document.getElementById('dashboard-charts-grid');
        if (total === 0) {
          emptyEl.classList.remove('hidden');
          gridEl.classList.add('hidden');
          return;
        }
        emptyEl.classList.add('hidden');
        gridEl.classList.remove('hidden');

        document.getElementById('dashboard-recent-tbody').innerHTML = scans.slice(0, 8).map(s => `
          <tr class="hover:bg-slate-900/60">
            <td class="py-2.5 px-3 font-mono text-cyan-300">${s.id}</td>
            <td class="py-2.5 px-3 text-slate-200 max-w-[180px] truncate">${CryptoMeta.escapeHtml(s.fileName)}</td>
            <td class="py-2.5 px-3 font-mono text-slate-300">${s.modality}</td>
            <td class="py-2.5 px-3 font-semibold ${s.verdict.includes('Manipulated') || s.verdict.includes('AI') ? 'text-rose-400' : s.verdict === 'Inconclusive' ? 'text-amber-300' : 'text-emerald-400'}">${s.verdict}</td>
            <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-mono border ${s.riskBadgeClass}">${s.riskTier}</span></td>
            <td class="py-2.5 px-3 flex items-center gap-2">
              <button onclick="HistoryStore.openDetailModal('${s.id}')" class="text-cyan-400 hover:underline">Inspect</button>
              <button onclick="PDFExport.downloadReport('${s.id}')" class="text-purple-400 hover:underline">PDF</button>
            </td>
          </tr>
        `).join('');

        if (!window.Chart) return;
        ['verdicts', 'modalities', 'risks'].forEach(k => { if (this.charts[k]) this.charts[k].destroy(); });

        const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#CBD5E1', font: { size: 11 } } } } };

        this.charts.verdicts = new Chart(document.getElementById('chart-verdicts'), {
          type: 'doughnut',
          data: {
            labels: ['Manipulated / AI', 'Authentic / Human', 'Inconclusive'],
            datasets: [{ data: [manipC, authC, incC], backgroundColor: ['#F43F5E', '#10B981', '#F59E0B'], borderColor: '#0B1120', borderWidth: 2 }]
          },
          options: opts
        });

        const docLinkC = scans.filter(s => s.modality === 'Document' || s.modality === 'Link').length;
        this.charts.modalities = new Chart(document.getElementById('chart-modalities'), {
          type: 'bar',
          data: {
            labels: ['Video', 'Voice', 'Image', 'Doc/Link'],
            datasets: [{ label: 'Scans', data: [videoC, voiceC, imageC, docLinkC], backgroundColor: ['#00D2FF', '#8B5CF6', '#3B82F6', '#10B981'], borderRadius: 6 }]
          },
          options: { ...opts, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94A3B8' } }, y: { ticks: { color: '#94A3B8', stepSize: 1 } } } }
        });

        this.charts.risks = new Chart(document.getElementById('chart-risks'), {
          type: 'polarArea',
          data: {
            labels: ['High Risk', 'Moderate Risk', 'Low Risk', 'Inconclusive'],
            datasets: [{
              data: [
                scans.filter(s => s.riskTier === 'HIGH RISK').length,
                scans.filter(s => s.riskTier === 'MODERATE RISK').length,
                scans.filter(s => s.riskTier === 'LOW RISK').length,
                scans.filter(s => s.riskTier === 'INCONCLUSIVE').length
              ],
              backgroundColor: ['rgba(244,63,94,0.65)', 'rgba(249,115,22,0.65)', 'rgba(16,185,129,0.65)', 'rgba(245,158,11,0.65)']
            }]
          },
          options: { ...opts, scales: { r: { ticks: { display: false }, grid: { color: 'rgba(148,163,184,0.15)' } } } }
        });
      }
    };

    /*************************************************************************
     * MODULE 11: HistoryStore — User-Isolated Local Persistence & QR Modal
     *************************************************************************/
    const HistoryStore = {
      currentUser: null,
      scans: [],
      authMode: 'login',

      init() {
        try {
          const u = localStorage.getItem('dg_active_user');
          if (u) this.currentUser = JSON.parse(u);
        } catch (_) {}
        this.updateUserUI();
        this.loadScans();
      },

      getKey() {
        return this.currentUser ? `dg_scans_${this.currentUser.email}` : 'dg_scans_guest';
      },

      loadScans() {
        try {
          this.scans = JSON.parse(localStorage.getItem(this.getKey()) || '[]');
        } catch (_) {
          this.scans = [];
        }
        document.getElementById('nav-history-badge').textContent = this.scans.length;
        if (UIController.currentView === 'dashboard') Dashboard.refresh();
        if (UIController.currentView === 'history') this.renderHistoryView();
      },

      saveRecord(record) {
        this.scans.unshift(record);
        try {
          localStorage.setItem(this.getKey(), JSON.stringify(this.scans.slice(0, 100)));
        } catch (_) {
          const compact = this.scans.map(s => ({ ...s, frameThumbnails: [] }));
          localStorage.setItem(this.getKey(), JSON.stringify(compact.slice(0, 100)));
        }
        document.getElementById('nav-history-badge').textContent = this.scans.length;
      },

      openAuthModal() {
        const m = document.getElementById('auth-modal');
        m.classList.remove('hidden'); m.classList.add('flex');
        if (this.currentUser) {
          document.getElementById('auth-form').classList.add('hidden');
          document.getElementById('logged-in-panel').classList.remove('hidden');
          document.getElementById('active-user-name').textContent = this.currentUser.name;
          document.getElementById('active-user-email').textContent = this.currentUser.email;
        } else {
          document.getElementById('auth-form').classList.remove('hidden');
          document.getElementById('logged-in-panel').classList.add('hidden');
        }
      },

      closeAuthModal() {
        const m = document.getElementById('auth-modal');
        m.classList.add('hidden'); m.classList.remove('flex');
      },

      switchAuthTab(mode) {
        this.authMode = mode;
        const ng = document.getElementById('auth-name-group');
        const sb = document.getElementById('auth-submit-btn');
        if (mode === 'signup') {
          ng.classList.remove('hidden'); sb.textContent = 'Create Encrypted Workspace';
        } else {
          ng.classList.add('hidden'); sb.textContent = 'Authenticate Session';
        }
      },

      async handleAuthSubmit(e) {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim().toLowerCase();
        const pass = document.getElementById('auth-password').value;
        const name = document.getElementById('auth-name').value.trim();
        const passHash = await CryptoMeta.sha256String(`${email}:${pass}`);
        const db = JSON.parse(localStorage.getItem('dg_users_db') || '{}');

        if (!db[email]) {
          db[email] = { name: name || email.split('@')[0], email, passHash };
          localStorage.setItem('dg_users_db', JSON.stringify(db));
        } else if (db[email].passHash !== passHash) {
          ToastUI.show('Invalid passphrase for this analyst account.', 'error');
          return;
        }

        this.currentUser = db[email];
        localStorage.setItem('dg_active_user', JSON.stringify(this.currentUser));
        this.updateUserUI();
        this.loadScans();
        this.closeAuthModal();
        ToastUI.show(`Signed in as ${this.currentUser.name}. Private scan partition loaded.`, 'success');
      },

      logoutUser() {
        this.currentUser = null;
        localStorage.removeItem('dg_active_user');
        this.updateUserUI();
        this.loadScans();
        this.closeAuthModal();
        ToastUI.show('Signed out. Switched to Guest Sandbox.', 'info');
      },

      updateUserUI() {
        const lbl = document.getElementById('nav-user-label');
        const hLbl = document.getElementById('history-workspace-label');
        if (this.currentUser) {
          lbl.textContent = this.currentUser.name;
          if (hLbl) hLbl.textContent = `${this.currentUser.name} (${this.currentUser.email})`;
        } else {
          lbl.textContent = 'Analyst Login';
          if (hLbl) hLbl.textContent = 'Guest Sandbox (Local Session)';
        }
      },

      renderHistoryView() {
        const container = document.getElementById('history-list-container');
        const q = (document.getElementById('history-search').value || '').toLowerCase();
        const f = document.getElementById('history-filter').value;
        const filtered = this.scans.filter(s => (f === 'ALL' || s.modality === f) && (s.fileName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)));

        if (filtered.length === 0) {
          container.innerHTML = `<div class="glass-card rounded-2xl p-8 text-center text-xs text-slate-400">No scan records match the active workspace filter.</div>`;
          return;
        }

        container.innerHTML = filtered.map(s => `
          <div class="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs text-cyan-400 font-bold">${s.id}</span>
                <span class="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-300">${s.modality}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${s.riskBadgeClass}">${s.riskTier}</span>
              </div>
              <p class="text-sm font-bold text-white truncate">${CryptoMeta.escapeHtml(s.fileName)}</p>
              <p class="text-[11px] font-mono text-slate-400">Verdict: <strong class="text-slate-200">${s.verdict}</strong> • Anomaly Index: ${s.signalScore}/100 • ${new Date(s.timestamp).toLocaleString()}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button onclick="HistoryStore.openDetailModal('${s.id}')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition">Details</button>
              <button onclick="PDFExport.openQRModal('${s.id}')" class="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/35 text-xs font-semibold text-purple-200 transition">QR</button>
              <button onclick="PDFExport.downloadReport('${s.id}')" class="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/35 text-xs font-semibold text-cyan-200 transition">PDF</button>
              <button onclick="HistoryStore.deleteScan('${s.id}')" class="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition" title="Delete">✕</button>
            </div>
          </div>
        `).join('');
      },

      openDetailModal(id) {
        const rec = this.scans.find(s => s.id === id);
        if (!rec) return;
        document.getElementById('modal-detail-id').textContent = `${rec.id} // ${rec.modality.toUpperCase()} FORENSICS`;
        document.getElementById('modal-detail-title').textContent = rec.fileName;
        document.getElementById('detail-modal-body').innerHTML = PDFExport.buildVerdictHTML(rec);
        const m = document.getElementById('detail-modal');
        m.classList.remove('hidden'); m.classList.add('flex');
      },

      closeDetailModal() {
        const m = document.getElementById('detail-modal');
        m.classList.add('hidden'); m.classList.remove('flex');
      },

      deleteScan(id) {
        this.scans = this.scans.filter(s => s.id !== id);
        localStorage.setItem(this.getKey(), JSON.stringify(this.scans));
        document.getElementById('nav-history-badge').textContent = this.scans.length;
        this.renderHistoryView();
        ToastUI.show('Forensic record removed.', 'info');
      },

      confirmClearHistory() {
        if (this.scans.length === 0) return;
        ToastUI.confirm('Purge Workspace Scan History?', 'This permanently removes all saved reports from your current analyst partition.', () => {
          this.scans = [];
          localStorage.removeItem(this.getKey());
          document.getElementById('nav-history-badge').textContent = '0';
          this.renderHistoryView();
          ToastUI.show('Workspace scan history purged.', 'success');
        });
      }
    };

    /*************************************************************************
     * MODULE 12: PDFExport — Explainable AI Card, QR Share & jsPDF Certificate
     *************************************************************************/
    const PDFExport = {
      buildVerdictHTML(record, extraBanner = '') {
        const isFake = record.verdict.includes('Manipulated') || record.verdict.includes('AI-Generated');
        const isAuth = record.verdict.includes('Authentic') || record.verdict.includes('Human');
        const vColor = isFake ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' : isAuth ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : 'text-amber-300 border-amber-500/40 bg-amber-500/10';

        return `
          <div class="glass-card rounded-2xl p-5 space-y-4 border border-cyan-500/25">
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="text-[11px] font-mono text-cyan-400">ANALYSIS ID: ${record.id}</span>
                <h3 class="text-base font-bold text-white mt-0.5 break-all">${CryptoMeta.escapeHtml(record.fileName)}</h3>
                <p class="text-[11px] font-mono text-slate-400 mt-0.5">${record.fileSize} • ${new Date(record.timestamp).toLocaleString()}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-mono font-bold border ${record.riskBadgeClass} shrink-0">${record.riskTier}</span>
            </div>

            <div class="p-4 rounded-2xl border ${vColor}">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-[11px] font-mono uppercase opacity-80">FORENSIC VERDICT</p>
                  <p class="text-xl font-extrabold mt-0.5">${record.verdict}</p>
                </div>
                <div class="text-right">
                  <p class="text-[11px] font-mono opacity-80">ANOMALY INDEX</p>
                  <p class="text-xl font-mono font-extrabold">${record.signalScore}/100</p>
                </div>
              </div>
              <p class="text-[11px] opacity-85 mt-2">Note: Anomaly index reflects measured signal &amp; neural deviations, not absolute mathematical certainty.</p>
            </div>

            ${extraBanner}

            <div class="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-mono text-slate-400">SHA-256 INTEGRITY HASH</span>
                <button onclick="PDFExport.copyText('${record.sha256}')" class="text-[11px] font-mono text-cyan-400 hover:underline">Copy Hash</button>
              </div>
              <p class="font-mono text-[11px] text-slate-300 break-all">${record.sha256}</p>
              <p class="text-[11px] text-slate-400 pt-1"><strong class="text-slate-200">Content Credentials:</strong> ${CryptoMeta.escapeHtml(record.metadata.c2paStatus)}</p>
            </div>

            <div class="space-y-2.5">
              <h4 class="text-xs font-mono uppercase tracking-wider text-cyan-300">Explainable AI (XAI) Forensic Findings</h4>
              ${record.xaiFindings.map(f => `
                <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div class="flex flex-wrap items-center justify-between gap-1">
                    <span class="text-xs font-bold text-white">${CryptoMeta.escapeHtml(f.name)}</span>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-500/20">${CryptoMeta.escapeHtml(f.badge)}</span>
                  </div>
                  <p class="text-[11px] font-mono text-purple-300">Scope: ${CryptoMeta.escapeHtml(f.region)}</p>
                  <p class="text-xs text-slate-300 leading-relaxed">${CryptoMeta.escapeHtml(f.explanation)}</p>
                </div>
              `).join('')}
            </div>

            <div class="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <h4 class="text-xs font-bold text-white">Cybersecurity Recommendations</h4>
              <ul class="list-disc list-inside text-xs text-slate-300 space-y-1">
                ${record.recommendations.map(r => `<li>${CryptoMeta.escapeHtml(r)}</li>`).join('')}
              </ul>
            </div>

            <div class="grid sm:grid-cols-2 gap-2.5">
              <button onclick="PDFExport.downloadReport('${record.id}')" class="py-3 rounded-xl cyber-btn-primary text-xs font-bold">Download PDF Report</button>
              <button onclick="PDFExport.openQRModal('${record.id}')" class="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-400/35 text-xs font-semibold text-cyan-200 transition">Share Verification QR</button>
            </div>
          </div>
        `;
      },

      openQRModal(scanId) {
        const rec = HistoryStore.scans.find(s => s.id === scanId);
        if (!rec) return;
        const target = document.getElementById('qr-modal-target');
        target.innerHTML = '';
        const payload = `DeepGuardAI|ID:${rec.id}|Verdict:${rec.verdict}|Score:${rec.signalScore}/100|SHA256:${rec.sha256.slice(0, 16)}`;
        if (window.QRCode) new QRCode(target, { text: payload, width: 168, height: 168 });
        document.getElementById('qr-modal-caption').textContent = payload;
        const m = document.getElementById('qr-modal');
        m.classList.remove('hidden'); m.classList.add('flex');
      },

      downloadReport(scanId) {
        const rec = HistoryStore.scans.find(s => s.id === scanId);
        if (!rec || !window.jspdf || !window.jspdf.jsPDF) {
          ToastUI.show('PDF engine unavailable or scan not found.', 'error');
          return;
        }
        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ unit: 'pt', format: 'a4' });
          const pageW = doc.internal.pageSize.getWidth();
          let y = 42;

          doc.setFillColor(5, 9, 20);
          doc.rect(0, 0, pageW, 86, 'F');
          doc.setTextColor(0, 210, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(18);
          doc.text('DEEPGUARD AI', 40, 36);
          doc.setTextColor(226, 232, 240);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('MULTIMODAL DEEPFAKE DETECTION & MEDIA FORENSIC CERTIFICATE', 40, 54);
          doc.setTextColor(148, 163, 184);
          doc.text(`Report ID: ${rec.id}  |  Generated: ${new Date(rec.timestamp).toUTCString()}`, 40, 70);

          const qrStage = document.getElementById('pdf-qr-staging');
          qrStage.innerHTML = '';
          if (window.QRCode) {
            new QRCode(qrStage, { text: `DeepGuardAI|ID:${rec.id}|Verdict:${rec.verdict}|SHA256:${rec.sha256.slice(0, 16)}`, width: 96, height: 96 });
            const qrCanvas = qrStage.querySelector('canvas');
            if (qrCanvas) doc.addImage(qrCanvas.toDataURL('image/png'), 'PNG', pageW - 108, 12, 64, 64);
          }

          y = 112;
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('1. EVIDENCE SUMMARY & CLASSIFICATION', 40, y);
          y += 18;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          [
            `Target Asset: ${rec.fileName}`,
            `Modality & Size: ${rec.modality}  |  ${rec.fileSize}`,
            `Forensic Verdict: ${rec.verdict}  (Anomaly Index: ${rec.signalScore}/100)`,
            `Fraud Risk Tier: ${rec.riskTier}`,
            `SHA-256 Digest: ${rec.sha256}`,
            `Content Credentials: ${rec.metadata.c2paStatus}`
          ].forEach(line => {
            const wrapped = doc.splitTextToSize(line, pageW - 80);
            doc.text(wrapped, 40, y);
            y += wrapped.length * 14;
          });

          y += 12;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('2. EXPLAINABLE AI (XAI) FORENSIC FINDINGS', 40, y);
          y += 18;
          rec.xaiFindings.forEach((f, i) => {
            if (y > 720) { doc.addPage(); y = 45; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`${i + 1}. ${f.name} [${f.badge}]`, 40, y);
            y += 13;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            const lines = doc.splitTextToSize(`Scope: ${f.region} — ${f.explanation}`, pageW - 85);
            doc.text(lines, 50, y);
            y += lines.length * 13 + 6;
          });

          if (y > 680) { doc.addPage(); y = 45; }
          y += 10;
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          const disc = doc.splitTextToSize('DISCLAIMER: DeepGuard AI provides automated signal, neural, and metadata forensic indicators. Anomaly scores do not constitute absolute mathematical certainty, and stripped metadata on social downloads does not automatically prove forgery.', pageW - 80);
          doc.text(disc, 40, y);

          doc.save(`DeepGuard-Forensic-Report-${rec.id}.pdf`);
          ToastUI.show(`Downloaded Forensic PDF Report (${rec.id})`, 'success');
        } catch (_) {
          ToastUI.show('Failed to generate PDF report.', 'error');
        }
      },

      copyText(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        ToastUI.show('Copied SHA-256 digest to clipboard.', 'success');
      }
    };

    // Bootstrap Application
    window.addEventListener('DOMContentLoaded', () => {
      HistoryStore.init();
      UIController.navigateTo('home');
      UIController.startHeroRadar();
      UIController.setupDropzones();
    });
  