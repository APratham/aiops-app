const { ipcMain } = require('electron');
const { exec } = require('child_process');

function setupApiManager(token) {
    ipcMain.on('call-protected-endpoint', async (event) => {
        try {
            console.log('Making API call to protected endpoint...');
            console.log('Token:', token);

            const accessToken = token.access_token;

            if (!accessToken) {
                throw new Error('Access token is undefined');
            } else {
                console.log('Access token:', accessToken);
            }

            // Construct the curl command with -s to suppress the progress meter
            const curlCommand = `curl -s -H "Authorization: Bearer ${accessToken}" http://localhost:3000/api/protected-endpoint`;

            // Execute the curl command
            exec(curlCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error during API call: ${error.message}`);
                    event.sender.send('api-call-failure', error.message);
                    return;
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    event.sender.send('api-call-failure', stderr);
                    return;
                }

                // If successful, emit a success event back to the renderer process with the response
                event.sender.send('api-call-success', stdout);
            });

        } catch (error) {
            console.error('Error during API call:', error);
            event.sender.send('api-call-failure', error.message);
        }
    });
}

module.exports = { setupApiManager };
