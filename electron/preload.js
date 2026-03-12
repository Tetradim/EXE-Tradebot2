const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl:  () => ipcRenderer.invoke('get-backend-url'),
  getAppVersion:  () => ipcRenderer.invoke('get-app-version'),
  getDataPath:    () => ipcRenderer.invoke('get-data-path'),
});
