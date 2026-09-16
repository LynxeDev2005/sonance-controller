const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('sonanceAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  generateQrCode: (payload) => ipcRenderer.invoke('generate-qr-code', payload),
  updateConfig: (newConfig) => ipcRenderer.invoke('update-config', newConfig),
  toggleAutoStart: (enable) => ipcRenderer.invoke('toggle-auto-start', enable),
  executePowerAction: (action) => ipcRenderer.invoke('execute-power-action', action),
  runAutoConfigure: () => ipcRenderer.invoke('run-auto-configure'),
  restartPC: () => ipcRenderer.invoke('restart-pc'),
  copyToClipboard: (text) => {
    clipboard.writeText(text);
    return true;
  },
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  hideToTray: () => ipcRenderer.send('window-hide'),
  closeApp: () => ipcRenderer.send('app-quit'),
  onLog: (callback) => {
    ipcRenderer.on('server-log', (_event, logItem) => callback(logItem));
  },
  onStatusChange: (callback) => {
    ipcRenderer.on('status-change', (_event, status) => callback(status));
  },
});
