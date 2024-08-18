const axios = require('axios');
const { app, BrowserWindow, ipcMain, ipcRenderer, IpcRendererEvent, protocol } = require('electron');
const Store = require('electron-store');  // Import electron-store

const store = new Store();  // Instantiate electron-store

function ipcManager() {

    ipcMain.handle('get-store-value', (event, key) => {
        console.log(`Received request to get value for key: ${key}`);
        return store.get(key);
      });      
      
      ipcMain.handle('set-store-value', (event, key, value) => {
        store.set(key, value);
      });

}

module.exports = { ipcManager };