const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    sendSync: (channel, data) => ipcRenderer.sendSync(channel, data), 
    once: (channel, listener) => ipcRenderer.once(channel, (event, ...args) => listener(event, ...args)),
    on: (channel, listener) => ipcRenderer.on(channel, (event, ...args) => listener(event, ...args)),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    openNewWindow: () => ipcRenderer.send('open-new-window'),
    closeWindow: () => ipcRenderer.send('close-window'), // Close window method
  }
});