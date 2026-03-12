#!/bin/bash
# Build script for TradingBot Windows Desktop Application

set -e

echo "=== TradingBot Desktop Build Script ==="
echo ""

# Check if running on Windows or Linux
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    PYTHON_CMD="python"
    PIP_CMD="pip"
else
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
fi

# Step 1: Build the backend with PyInstaller
echo "Step 1: Building Python backend..."
cd ../backend

# Install PyInstaller if not present
$PIP_CMD install pyinstaller

# Create PyInstaller spec file for the backend
$PYTHON_CMD -m PyInstaller \
    --name server \
    --onefile \
    --add-data "broker_clients:broker_clients" \
    --add-data "models:models" \
    --add-data "utils:utils" \
    --hidden-import uvicorn.logging \
    --hidden-import uvicorn.loops \
    --hidden-import uvicorn.loops.auto \
    --hidden-import uvicorn.protocols \
    --hidden-import uvicorn.protocols.http \
    --hidden-import uvicorn.protocols.http.auto \
    --hidden-import uvicorn.protocols.websockets \
    --hidden-import uvicorn.protocols.websockets.auto \
    --hidden-import uvicorn.lifespan \
    --hidden-import uvicorn.lifespan.on \
    server.py

# Move the built executable
mkdir -p ../desktop/backend-dist
cp dist/server* ../desktop/backend-dist/

echo "Backend build complete!"

# Step 2: Build the frontend web bundle
echo ""
echo "Step 2: Building frontend web bundle..."
cd ../frontend

# Export for web
npx expo export --platform web --output-dir ../desktop/web-dist

echo "Frontend build complete!"

# Step 3: Copy web files to desktop
echo ""
echo "Step 3: Preparing Electron app..."
cd ../desktop

# Copy web build to desktop app
cp -r web-dist/* ./ 2>/dev/null || true

# Rename index.html if needed
if [ -f "web-dist/index.html" ]; then
    cp web-dist/index.html index.html
fi

echo "Files prepared!"

# Step 4: Build Electron app
echo ""
echo "Step 4: Building Windows executable..."

# Install dependencies
yarn install

# Build for Windows
yarn build:win

echo ""
echo "=== Build Complete! ==="
echo "The Windows installer can be found in: desktop/dist/"
