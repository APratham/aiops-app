const axios = require('axios');
const { app, BrowserWindow, ipcMain, protocol } = require('electron');

function setupApiManager(token) {
    ipcMain.on('call-protected-endpoint', async (event) => {

    });
}

module.exports = { setupApiManager };

