const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApp', {
  isDesktop: true,
  getVersion: () => ipcRenderer.invoke('app-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
