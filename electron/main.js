const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess;
const BACKEND_PORT = 8001;
const BACKEND_URL  = `http://localhost:${BACKEND_PORT}`;
const isDev        = !app.isPackaged;

function getBackendPath() {
  if (isDev) return path.join(__dirname, '..', 'backend');
  return path.join(process.resourcesPath, 'backend');
}

function findPython() {
  const exePath = path.join(getBackendPath(), 'server.exe');
  try {
    require('fs').accessSync(exePath);
    return { exe: exePath, args: [], useExe: true };
  } catch (_) {}

  const candidates = ['python', 'python3', 'py'];
  const localApp = process.env.LOCALAPPDATA || '';
  for (const ver of ['311', '312', '310', '39']) {
    candidates.push(path.join(localApp, 'Programs', 'Python', `Python${ver}`, 'python.exe'));
  }
  for (const cmd of candidates) {
    try {
      execSync(`"${cmd}" --version`, { stdio: 'ignore' });
      return {
        exe: cmd,
        args: ['-m', 'uvicorn', 'server:app', '--host', '0.0.0.0', '--port', String(BACKEND_PORT)],
        useExe: false
      };
    } catch (_) {}
  }
  return null;
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const python = findPython();
    if (!python) {
      reject(new Error(
        'Python not found.\n\nPlease install Python 3.9+ from https://python.org\n' +
        'Make sure to check "Add Python to PATH" during installation.'
      ));
      return;
    }

    const backendPath = getBackendPath();
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'tradebot.db');

    console.log('[main] Backend path:', backendPath);
    console.log('[main] Python:', python.exe);

    let stderrBuffer = '';
    let settled = false;

    const spawnArgs = python.useExe ? [] : python.args;
    backendProcess = spawn(python.exe, spawnArgs, {
      cwd: backendPath,
      env: {
        ...process.env,
        USE_SQLITE:       'true',
        DATABASE_PATH:    dbPath,
        PORT:             String(BACKEND_PORT),
        PYTHONUNBUFFERED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // ── Resolve as soon as uvicorn prints startup complete ────────────────
    // This fires whether the message appears on stdout or stderr
    function checkReady(text) {
      if (!settled && text.includes('Application startup complete')) {
        settled = true;
        console.log('[main] Backend ready');
        resolve();
      }
    }

    backendProcess.stdout.on('data', d => {
      const text = d.toString();
      console.log('[backend]', text.trim());
      checkReady(text);
    });

    backendProcess.stderr.on('data', d => {
      const text = d.toString();
      stderrBuffer += text;
      console.error('[backend-err]', text.trim());
      checkReady(text); // uvicorn logs startup complete to stderr too
      if (stderrBuffer.length > 4000) {
        stderrBuffer = '...(truncated)...\n' + stderrBuffer.slice(-4000);
      }
    });

    backendProcess.on('error', err => {
      if (settled) return;
      settled = true;
      reject(new Error(
        `Failed to launch backend.\n\nCommand: ${python.exe}\nError: ${err.message}`
      ));
    });

    // Process exited before startup complete — it crashed
    backendProcess.once('exit', code => {
      if (settled) return;
      settled = true;
      const stderr = stderrBuffer.trim() || '(no output captured)';
      reject(new Error(
        `Backend exited with code ${code} before becoming ready.\n\n` +
        `--- Python error output ---\n${stderr}\n\n` +
        `Backend path: ${backendPath}`
      ));
    });

    // Hard timeout — 120s should be plenty even for slow machines
    setTimeout(() => {
      if (settled) return;
      settled = true;
      const stderr = stderrBuffer.trim() || '(no output captured)';
      reject(new Error(
        `Backend did not start after 120 seconds.\n\n` +
        `--- Python error output ---\n${stderr}`
      ));
    }, 120000);
  });
}

function stopBackend() {
  if (!backendProcess) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /PID ${backendProcess.pid} /T`, { stdio: 'ignore' });
    } else {
      backendProcess.kill('SIGTERM');
    }
  } catch (_) {}
  backendProcess = null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1400,
    height: 900,
    minWidth:  1000,
    minHeight: 700,
    show: false,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon:  path.join(__dirname, 'assets', 'icon.png'),
    title: 'Trading Bot',
    backgroundColor: '#0f172a',
  });

  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Error window (copyable) ───────────────────────────────────────────────────
function showErrorWindow(message) {
  const errWin = new BrowserWindow({
    width: 640, height: 500,
    minWidth: 400, minHeight: 300,
    title: 'Trading Bot — Error',
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  const encoded = encodeURIComponent(message);
  errWin.loadFile('error.html', { query: { msg: encoded } });
  errWin.on('closed', () => app.quit());
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (err) {
    console.error('[main] Startup failed:', err.message);
    showErrorWindow(err.message);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', stopBackend);

// ── IPC handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('get-backend-url',  () => BACKEND_URL);
ipcMain.handle('get-app-version',  () => app.getVersion());
ipcMain.handle('get-data-path',    () => app.getPath('userData'));
