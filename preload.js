const { contextBridge, ipcRenderer } = require('electron');

// General IPC communication
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    once: (channel, listener) => ipcRenderer.once(channel, (event, ...args) => listener(event, ...args)),
    on: (channel, listener) => ipcRenderer.on(channel, (event, ...args) => listener(event, ...args)),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  },
  
  // Specific methods for user session data and app start
  getUserSessionData: () => ipcRenderer.send('get-user-session-data'),
  onUserSessionData: (callback) => ipcRenderer.on('user-session-data', (event, data) => callback(data)),
  onAppStart: (callback) => ipcRenderer.on('app-start', (event, data) => callback(data)),
});

// Electron Store access
contextBridge.exposeInMainWorld('electronStore', {
  get: (key) => ipcRenderer.invoke('electron-store-get', key),
  set: (key, value) => ipcRenderer.invoke('electron-store-set', key, value),
  clear: () => ipcRenderer.invoke('electron-store-clear'),
  delete: (key) => ipcRenderer.invoke('electron-store-delete', key),
});
