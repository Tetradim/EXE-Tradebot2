@echo off
REM Build script for TradingBot Windows Desktop Application
REM Run this on a Windows machine with Python and Node.js installed

echo === TradingBot Desktop Build Script ===
echo.

REM Step 1: Build the backend with PyInstaller
echo Step 1: Building Python backend...
cd ..\backend

REM Install PyInstaller if not present
pip install pyinstaller

REM Create the executable
python -m PyInstaller ^
    --name server ^
    --onefile ^
    --add-data "broker_clients;broker_clients" ^
    --add-data "models;models" ^
    --add-data "utils;utils" ^
    --hidden-import uvicorn.logging ^
    --hidden-import uvicorn.loops ^
    --hidden-import uvicorn.loops.auto ^
    --hidden-import uvicorn.protocols ^
    --hidden-import uvicorn.protocols.http ^
    --hidden-import uvicorn.protocols.http.auto ^
    --hidden-import uvicorn.protocols.websockets ^
    --hidden-import uvicorn.protocols.websockets.auto ^
    --hidden-import uvicorn.lifespan ^
    --hidden-import uvicorn.lifespan.on ^
    server.py

REM Move the built executable
if not exist "..\desktop\backend-dist" mkdir "..\desktop\backend-dist"
copy dist\server.exe ..\desktop\backend-dist\

echo Backend build complete!

REM Step 2: Build the frontend web bundle
echo.
echo Step 2: Building frontend web bundle...
cd ..\frontend

REM Export for web
call npx expo export --platform web --output-dir ..\desktop\web-dist

echo Frontend build complete!

REM Step 3: Copy web files to desktop
echo.
echo Step 3: Preparing Electron app...
cd ..\desktop

REM Copy web build to desktop app
if exist "web-dist\index.html" copy web-dist\index.html index.html

echo Files prepared!

REM Step 4: Build Electron app
echo.
echo Step 4: Building Windows executable...

REM Install dependencies
call yarn install

REM Build for Windows
call yarn build:win

echo.
echo === Build Complete! ===
echo The Windows installer can be found in: desktop\dist\
pause
