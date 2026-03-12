// renderer.js — loads the Expo web app once the backend is ready

const BACKEND_URL = 'http://localhost:8001';
const MAX_RETRIES = 60;   // 60 × 1000ms = 60s
const RETRY_MS   = 1000;

function setSplash(msg) {
  const el = document.getElementById('splash-status');
  if (el) el.textContent = msg;
}

function showApp() {
  document.getElementById('splash').classList.add('hidden');
  const frame = document.getElementById('app-frame');
  frame.src = 'web-dist/index.html';
  frame.classList.add('visible');
}

function showError(msg) {
  const splash = document.getElementById('splash');
  splash.innerHTML = `
    <div style="max-width:560px;padding:24px;display:flex;flex-direction:column;gap:12px">
      <div style="font-size:1.1rem;color:#f87171;font-weight:600">⚠️ Backend failed to start</div>
      <p style="color:#94a3b8;font-size:0.8rem">Copy the error below and share it for support:</p>
      <div id="err-box" style="
        background:#1e293b;border:1px solid #334155;border-radius:6px;
        padding:12px;font-family:monospace;font-size:0.75rem;color:#fca5a5;
        white-space:pre-wrap;word-break:break-all;
        user-select:text;cursor:text;max-height:200px;overflow-y:auto;
        text-align:left">${msg}</div>
      <div style="display:flex;gap:10px">
        <button id="copy-err-btn" onclick="
          navigator.clipboard.writeText(document.getElementById(\'err-box\').textContent).then(()=>{
            this.textContent=\'Copied!\';this.style.background=\'#22c55e\';
            setTimeout(()=>{this.textContent=\'Copy Error\';this.style.background=\'#3b82f6\';},2000);
          })"
          style="padding:8px 18px;background:#3b82f6;border:none;border-radius:6px;color:white;cursor:pointer;font-size:0.875rem">
          Copy Error
        </button>
        <button onclick="location.reload()"
          style="padding:8px 18px;background:#334155;border:none;border-radius:6px;color:#e2e8f0;cursor:pointer;font-size:0.875rem">
          Retry
        </button>
      </div>
    </div>`;
}

async function pingBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    return res.status === 200;
  } catch {
    return false;
  }
}

async function waitForBackend() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    setSplash(`Starting backend... (${i + 1}/${MAX_RETRIES})`);
    if (await pingBackend()) return true;
    await new Promise(r => setTimeout(r, RETRY_MS));
  }
  return false;
}

document.addEventListener('DOMContentLoaded', async () => {
  setSplash('Starting backend...');
  const ready = await waitForBackend();
  if (ready) {
    showApp();
  } else {
    showError('Backend did not respond after 20 seconds.\n\nCheck that the app installed correctly and try restarting.');
  }
});
