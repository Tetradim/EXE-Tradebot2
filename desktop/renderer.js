// Renderer script for Electron app
// This loads the React app once the backend is ready

const BACKEND_PORT = 8001;
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

async function checkBackendHealth() {
    try {
        const response = await fetch(`http://localhost:${BACKEND_PORT}/api/status`);
        return response.ok;
    } catch {
        return false;
    }
}

async function waitForBackend() {
    const statusText = document.getElementById('status-text');
    
    for (let i = 0; i < MAX_RETRIES; i++) {
        statusText.textContent = `Connecting to backend... (attempt ${i + 1}/${MAX_RETRIES})`;
        
        if (await checkBackendHealth()) {
            statusText.textContent = 'Backend ready! Loading app...';
            return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
    
    return false;
}

async function loadApp() {
    const appContainer = document.getElementById('app');
    
    const backendReady = await waitForBackend();
    
    if (!backendReady) {
        appContainer.innerHTML = `
            <div class="loading-container">
                <h2>Failed to start backend</h2>
                <p>Please check the logs and try restarting the application.</p>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #3b82f6;
                    border: none;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                ">Retry</button>
            </div>
        `;
        return;
    }
    
    // Load the React app in an iframe or directly
    // The web-dist folder should contain the exported Expo web app
    try {
        // Try to load the bundled web app
        const iframe = document.createElement('iframe');
        iframe.src = 'web-dist/index.html';
        iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
        
        // Clear the loading container and show the app
        appContainer.innerHTML = '';
        appContainer.appendChild(iframe);
        
        // Update iframe's backend URL
        iframe.onload = () => {
            try {
                iframe.contentWindow.postMessage({
                    type: 'SET_BACKEND_URL',
                    url: `http://localhost:${BACKEND_PORT}`
                }, '*');
            } catch (e) {
                console.log('Could not send message to iframe:', e);
            }
        };
    } catch (error) {
        console.error('Failed to load web app:', error);
        // Fallback: redirect directly to backend
        window.location.href = `http://localhost:${BACKEND_PORT}`;
    }
}

// Start loading when DOM is ready
document.addEventListener('DOMContentLoaded', loadApp);
