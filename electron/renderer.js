// renderer.js — loads the Expo web app once the backend is ready

const BACKEND_URL = 'http://localhost:8001';
const MAX_RETRIES = 60;   // 60 × 1000ms = 60s
const RETRY_MS   = 1000;

function setSplash(msg) {
  const el = document.getElementById('splash-status');
  if (el) el.textContent = msg;
}

function showApp() {
  // Hide splash and redirect to the Expo web app
  document.getElementById('splash').classList.add('hidden');
  // Navigate directly to the web-dist index.html
  window.location.href = 'web-dist/index.html';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(msg, details = '') {
  const fullError = details ? `${msg}\n\n--- Details ---\n${details}` : msg;
  const splash = document.getElementById('splash');
  splash.innerHTML = `
    <div style="max-width:600px;padding:24px;display:flex;flex-direction:column;gap:16px">
      <div style="font-size:1.2rem;color:#f87171;font-weight:600;display:flex;align-items:center;gap:8px">
        <span style="font-size:1.5rem">⚠️</span> Error Starting Trading Bot
      </div>
      
      <p style="color:#94a3b8;font-size:0.85rem;margin:0">
        Copy the error below and share it for support:
      </p>
      
      <div id="err-box" style="
        background:#1e293b;
        border:1px solid #334155;
        border-radius:8px;
        padding:16px;
        font-family:'Consolas','Courier New',monospace;
        font-size:0.75rem;
        line-height:1.6;
        color:#fca5a5;
        white-space:pre-wrap;
        word-break:break-all;
        user-select:text;
        cursor:text;
        max-height:250px;
        overflow-y:auto;
        text-align:left">${escapeHtml(fullError)}</div>
      
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button id="copy-err-btn" style="
          padding:10px 24px;
          background:#3b82f6;
          border:none;
          border-radius:6px;
          color:white;
          cursor:pointer;
          font-size:0.875rem;
          font-weight:500;
          transition:background 0.2s">
          📋 Copy Error
        </button>
        <button id="retry-btn" style="
          padding:10px 24px;
          background:#334155;
          border:none;
          border-radius:6px;
          color:#e2e8f0;
          cursor:pointer;
          font-size:0.875rem;
          font-weight:500">
          🔄 Retry
        </button>
      </div>
      
      <p style="color:#475569;font-size:0.7rem;margin:0">
        Tip: Press Ctrl+A then Ctrl+C in the error box to copy all text
      </p>
    </div>`;

  // Add event listeners
  document.getElementById('copy-err-btn').addEventListener('click', function() {
    const errorText = document.getElementById('err-box').textContent;
    navigator.clipboard.writeText(errorText).then(() => {
      this.textContent = '✓ Copied!';
      this.style.background = '#22c55e';
      setTimeout(() => {
        this.textContent = '📋 Copy Error';
        this.style.background = '#3b82f6';
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const range = document.createRange();
      range.selectNode(document.getElementById('err-box'));
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand('copy');
      this.textContent = '✓ Copied!';
      this.style.background = '#22c55e';
      setTimeout(() => {
        this.textContent = '📋 Copy Error';
        this.style.background = '#3b82f6';
      }, 2000);
    });
  });

  document.getElementById('retry-btn').addEventListener('click', () => {
    location.reload();
  });
}

async function pingBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { timeout: 5000 });
    return res.ok;
  } catch {
    return false;
  }
}

async function getBackendError() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    if (!res.ok) {
      const data = await res.json();
      return data.detail || `HTTP ${res.status}`;
    }
  } catch (e) {
    return e.message || 'Connection failed';
  }
  return null;
}

async function waitForBackend() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    setSplash(`Starting backend... (${i + 1}/${MAX_RETRIES})`);
    if (await pingBackend()) return { success: true };
    await new Promise(r => setTimeout(r, RETRY_MS));
  }
  const error = await getBackendError();
  return { success: false, error };
}

document.addEventListener('DOMContentLoaded', async () => {
  setSplash('Starting backend...');
  const result = await waitForBackend();
  
  if (result.success) {
    showApp();
  } else {
    const systemInfo = `
Platform: ${navigator.platform}
User Agent: ${navigator.userAgent}
Time: ${new Date().toISOString()}
Backend URL: ${BACKEND_URL}
Connection Error: ${result.error || 'Timeout after 60 seconds'}`.trim();

    showError(
      'Backend did not respond after 60 seconds.',
      `The Trading Bot backend server failed to start.\n\nPossible causes:\n- Python is not installed or not in PATH\n- Required dependencies are missing\n- Port 8001 is already in use\n- Antivirus blocking the application\n\n--- System Info ---\n${systemInfo}`
    );
  }
});
