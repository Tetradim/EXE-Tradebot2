# TradingBot Desktop Application

This directory contains the configuration to build TradingBot as a standalone Windows desktop application (.exe).

## Prerequisites

To build the Windows executable, you need:

1. **Windows Machine** (or Windows VM)
2. **Python 3.9+** with pip
3. **Node.js 18+** with yarn
4. **Git**

## Build Instructions

### Option 1: Automated Build (Recommended)

1. Clone the repository to your Windows machine
2. Open Command Prompt as Administrator
3. Navigate to the `desktop` folder
4. Run the build script:

```batch
build.bat
```

This will:
- Build the Python backend into `server.exe` using PyInstaller
- Export the React frontend for web
- Package everything into a Windows installer using Electron Builder

### Option 2: Manual Build

#### Step 1: Build the Backend

```bash
cd backend
pip install pyinstaller
python -m PyInstaller --name server --onefile server.py
```

#### Step 2: Build the Frontend

```bash
cd frontend
npx expo export --platform web --output-dir ../desktop/web-dist
```

#### Step 3: Build the Electron App

```bash
cd desktop
yarn install
yarn build:win
```

## Output

After building, you'll find:
- `desktop/dist/TradingBot Setup x.x.x.exe` - Windows installer
- `desktop/dist/win-unpacked/` - Portable version (no install needed)

## Features

The desktop version includes:
- **Fully Offline**: Backend bundled with the app, no internet needed for local operations
- **SQLite Database**: Local database stored in user's AppData folder
- **Auto-Start Backend**: Backend server starts automatically when app launches
- **Native Windows Integration**: System tray, notifications, file associations

## Configuration

The app stores its data in:
```
%APPDATA%/TradingBot/
├── tradebot.db      # SQLite database
├── config.json      # App settings
└── logs/            # Application logs
```

## Troubleshooting

### Backend won't start
- Check Windows Firewall isn't blocking the app
- Run as Administrator
- Check logs in `%APPDATA%/TradingBot/logs/`

### Build fails
- Ensure Python and Node.js are in PATH
- Try running Command Prompt as Administrator
- Delete `node_modules` and `dist` folders, then rebuild

## Development Mode

To run in development mode:

1. Start the backend:
```bash
cd backend
python server.py
```

2. Start the frontend:
```bash
cd frontend
npx expo start --web
```

3. Start Electron in dev mode:
```bash
cd desktop
set NODE_ENV=development
yarn start
```
