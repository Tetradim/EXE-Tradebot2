const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let backendProcess;

const isDev = process.env.NODE_ENV === 'development';
const backendPort = 8001;

function getBackendPath() {
  if (isDev) {
    return null; // Use external backend in dev mode
  }
  
  // In production, backend is in resources folder
  const resourcesPath = process.resourcesPath;
  const backendPath = path.join(resourcesPath, 'backend', 'server.exe');
  return backendPath;
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = getBackendPath();
    
    if (!backendPath) {
      console.log('Development mode: expecting external backend');
      resolve();
      return;
    }

    console.log('Starting backend from:', backendPath);
    
    // Set up environment for SQLite database in user data folder
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'tradebot.db');
    
    backendProcess = spawn(backendPath, [], {
      env: {
        ...process.env,
        DATABASE_URL: `sqlite:///${dbPath}`,
        USE_SQLITE: 'true',
        PORT: backendPort.toString()
      },
      cwd: path.dirname(backendPath)
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
      if (data.toString().includes('Application startup complete')) {
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });

    // Give backend time to start
    setTimeout(() => resolve(), 3000);
  });
}

function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend...');
    backendProcess.kill();
    backendProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'TradingBot',
    backgroundColor: '#0f172a'
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('index.html');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

// IPC handlers for renderer communication
ipcMain.handle('get-backend-url', () => {
  return `http://localhost:${backendPort}`;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});
