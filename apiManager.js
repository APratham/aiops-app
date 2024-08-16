const axios = require('axios');
const { app, BrowserWindow, ipcMain, protocol } = require('electron');

function setupApiManager(token) {
    ipcMain.on('call-protected-endpoint', async (event) => {
        try {
            console.log('Making API call to protected endpoint...');
            console.log('Token:', token);
            if (!token) {
                throw new Error('Token is undefined');
            }

            // Make the request to the protected endpoint
            const response = await axios.get('http://localhost:8000/api/protected-endpoint', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // If successful, emit a success event back to the renderer process
            event.sender.send('api-call-success', response.data);

        } catch (error) {
            console.error('Error during API call:', error);

            // If an error occurs, emit a failure event back to the renderer process
            event.sender.send('api-call-failure', error.message);
        }
    });
}

module.exports = { setupApiManager };

