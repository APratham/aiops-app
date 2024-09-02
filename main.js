 /* ------------------ Electron Main Process ------------------ 
 *                              __
 *    ____     ____          __/ /_ __        __
 *   / _  \   / __ \________/_   _// /_  ____/ /.-..-.
 *  / __  /  / ____/ __/ _ / /  /_/ __ \/ _ / .-. /, /
 * /_/ /_/../_/   /_/ /___/_/____/_/ /_/___/_/  // //
 *
 * ----------------------------------------------------------
 * 
 * Antariksh Pratham, N1191635
 * Major Project appplication
 * Masters in Cloud Computing, Nottingham Trent University
 * ----------------------------------------------------------
 * 
 * This file is the main process of the Electron application and
 * manages the entire application lifecycle. It creates the main
 * window, handles authentication, and communicates with the 
 * FastAPI backend for different tasks.
 * ----------------------------------------------------------
 * 
 * Electron Main Process: main.js
 * Ionic/Angular Frontend: index.html
 * Angular AppModule: src/app/app.module.ts
 * Express Server: express.js
 * FastAPI Backend: backend/main.py
 * ----------------------------------------------------------
 * 
 * GNU Affero General Public License v3 (AGPLv3)
 * 
 * This software is licensed under the GNU Affero General Public 
 * License version 3 (AGPLv3). By using or modifying this software, 
 * you agree to the following terms:
 * 
 * 1. Source Code Availability: You must provide access to the complete
 *   source code of any modified version of this software when it is
 *  used to provide a service over a network. This obligation extends
 *  to the source code of the software itself and any derivative works.
 * 
 * 2. Copyleft: Any distribution of this software or derivative works
 * must be licensed under the AGPLv3. You may not impose any additional
 * restrictions beyond those contained in this license.
 * 
 * 3. Disclaimer of Warranty: This software is provided "as-is," without
 * any warranty of any kind, express or implied, including but not 
 * limited to the warranties of merchantability or fitness for a 
 * particular purpose.
 * 
 * For the full terms of the AGPLv3, please refer to the full license 
 * text available at https://www.gnu.org/licenses/agpl-3.0.html.
 * ----------------------------------------------------------
*/

const { app, BrowserWindow, ipcMain, protocol, dialog } = require('electron');
const { OAuth2Client } = require('google-auth-library');
const { GOOGLE_OAUTH_CLIENT, MICROSOFT_OAUTH_CLIENT } = require('./secrets');
const msal = require('@azure/msal-node');
const crypto = require('crypto');
const keytar = require('keytar');
const Store = require('electron-store');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const URL = require('url').URL;
const path = require('path');
const { exec } = require('child_process');

const { cacheUserInfo } = require('./data-layer/dbOperations'); // Adjust path as necessary
const { checkAndRefreshGoogleToken } = require('./tokenManager');
const { setupApiManager } = require('./apiManager');
const { ipcManager } = require('./ipcManager');
const dal = require('./data-layer/dal');
const { get } = require('http');

const SERVICE_NAME = 'ElectronOAuthExample';
const GOOGLE_ACCOUNT_NAME = 'google-oauth-token';
const GOOGLE_UNIQUE_ID_KEY = 'google-unique-id';
const MS_ACCOUNT_NAME = 'ms-oauth-token';
const MS_UNIQUE_ID_KEY = 'ms-unique-id';

// Store the base URL in a variable
const BASE_URL = 'http://localhost:3000';
const store = new Store();

let mainWindow;
let choiceWindow;
let authWindow;
let splashWindow;

ipcMain.on('get-user-info', (event) => {
  const userInfo = store.get('userInfo', null);
  //console.log(store.path);
  //console.log(store.store);
  event.returnValue = userInfo; // Send the stored user info back to Angular
});

ipcMain.on('save-user-info', (event, userInfo) => {
  store.set('userInfo', userInfo);
  event.returnValue = true; // Confirm the data was saved successfully
});

ipcMain.on('get-profile-pic', (event) => {
  const profilePic = ('userInfo.profilePic', 'googleTokestore.getns');
  event.returnValue = profilePic;
});

ipcMain.on('container-selected', (event, containerData) => {
  console.log('Container selected:', containerData);
  if (mainWindow) {
    // Send the container data to the Angular app
    mainWindow.webContents.send('container-data', containerData);

    // Navigate to the /dashboard route
    mainWindow.webContents.send('navigate-to-dashboard');
  }
});

ipcMain.on('close-window', () => {
  if (BrowserWindow.getFocusedWindow()) {
    BrowserWindow.getFocusedWindow().close();
  }
});

function getDockerSetting() {
  const sub = store.get('userInfo.sub', null);

  return new Promise((resolve, reject) => {
      let db = new sqlite3.Database('./data-layer/local_database.sqlite', (err) => {
          if (err) {
              console.error('Could not connect to database', err);
              reject(err);
          } else {
              console.log('Connected to database');
          }
      });

      db.get("SELECT docker FROM user_settings WHERE sub = ?", [sub], (err, row) => {
          if (err) {
              console.error('Error running SQL query', err);
              reject(err);
          } else {
              resolve(row ? row.docker : 0);
          }
      });

      db.close((err) => {
          if (err) {
              console.error('Error closing the database', err);
          }
      });
  });
}

function isDockerRunning() {
  console.log('Checking if Docker is running...');
  return new Promise((resolve, reject) => {
      exec('docker run hello-world', (error, stdout, stderr) => {
          if (error) {
              console.log('Docker is not running:', error.message);
              resolve(false);
          } else {
              console.log('Docker is running.');
              resolve(true);
          }
      });
  });
}

function findDockerExecutable() {
  console.log('Looking for Docker executable in PATH and common locations...');
  return new Promise((resolve) => {
      exec('which docker', (error, stdout) => {
          if (!error && stdout) {
              console.log('Docker found in PATH:', stdout.trim());
              resolve(stdout.trim());
          } else {
              console.log('Docker not found in PATH, checking common locations...');
              // Fallback to check common paths
              const possiblePaths = [
                  path.join(process.env['USERPROFILE'], 'AppData\\Local\\Docker\\Docker.exe'),
                  path.join(process.env['ProgramFiles'], 'Docker\\Docker\\Docker Desktop.exe'),
                  '/usr/local/bin/docker',
                  '/usr/bin/docker'
              ];

              for (const p of possiblePaths) {
                  if (fs.existsSync(p)) {
                      console.log('Docker found at:', p);
                      resolve(p);
                      return;
                  }
              }
              console.log('Docker not found in any common locations.');
              resolve(null);
          }
      });
  });
}

async function attemptToStartDocker() {
  const dockerExecutable = await findDockerExecutable();

  if (!dockerExecutable) {
      dialog.showErrorBox('Docker Not Found', 'Docker could not be found on this system. Please install Docker to proceed.');
      return false;
  }

  console.log('Attempting to start Docker using executable:', dockerExecutable);

  return new Promise((resolve) => {
      exec(`${dockerExecutable}`, (error, stdout, stderr) => {
          if (error) {
              console.log('Failed to start Docker:', error.message);
              dialog.showErrorBox('Docker Failed to Start', 'Unable to start Docker. Please start Docker manually.');
              resolve(false);
          } else {
              console.log('Docker started successfully.');
              resolve(true);
          }
      });
  });
}

async function waitForDocker() {
  let dockerRunning = false;
  const retryInterval = 5000; // Retry every 5 seconds
  const maxRetries = 12; // Retry for a maximum of 1 minute (12 * 5 seconds)

  for (let i = 0; i < maxRetries; i++) {
      console.log(`Waiting for Docker... Attempt ${i + 1}/${maxRetries}`);
      dockerRunning = await isDockerRunning();
      if (dockerRunning) {
          break;
      }
      await new Promise(resolve => setTimeout(resolve, retryInterval));
  }

  return dockerRunning;
}

async function checkAndStartDocker() {
  const dockerSetting = await getDockerSetting();

  if (dockerSetting === 1) {
      // Docker on startup is enabled, attempt to start Docker with a warning
      dialog.showMessageBox({
          type: 'warning',
          buttons: ['OK'],
          title: 'Docker Startup',
          message: 'The application is attempting to start Docker.',
      });
      return await attemptToStartDocker();
  } else {
      // Docker on startup is not enabled, ask the user
      const dockerRunning = await isDockerRunning();
      if (dockerRunning) {
          return true;
      } else {
          const options = {
              type: 'question',
              buttons: ['Start Docker', 'I will start it', 'Cancel'],
              title: 'Docker Not Running',
              message: 'Docker is not running. Would you like to start Docker now?',
          };

          const response = await dialog.showMessageBox(options);
          if (response.response === 0) { // Start Docker
              return await attemptToStartDocker();
          } else if (response.response === 1) { // User will start Docker manually
              console.log('User chose to start Docker manually.');
              dialog.showMessageBox({
                  type: 'info',
                  buttons: ['OK'],
                  title: 'Waiting for Docker',
                  message: 'The application will wait for Docker to start. Please start Docker and the application will continue automatically.',
              });
              return await waitForDocker();
          } else { // Cancel
              console.log('User cancelled the operation.');
              return false;
          }
      }
  }
}

ipcMain.on('open-new-window', (event, arg) => {
  let choiceWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Load preload script
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  choiceWindow.loadURL(`${BASE_URL}/choicewindow`); // Adjust this URL to the new page/component

  choiceWindow.on('closed', () => {
    choiceWindow = null;
  });
});

app.on('ready', async () => {
  protocol.registerHttpProtocol('msal', (request, callback) => {
    const requestUrl = new URL(request.url);
    if (requestUrl.searchParams.has('code')) {
      handleMicrosoftAuthCode(requestUrl.searchParams.get('code'));
    }
    callback({ cancel: true });
  }, (error) => {
    if (error) {
      console.error('Failed to register protocol', error);
    }
  });

  ipcMain.on('update-title', (event, title) => {
    mainWindow.setTitle(title);
  });

  // Start the splash screen first
  splashWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  splashWindow.loadFile('splash.html');

  console.log('Starting Docker check...');
  const dockerStarted = await checkAndStartDocker();

  if (!dockerStarted) {
      // If Docker did not start, show an error and quit the app
      dialog.showErrorBox('Docker Required', 'Docker is required to run this application. Please start Docker and restart the application.');
      splashWindow.close();
      app.quit();
      return; // Prevent further execution
  }

  // If Docker started successfully, proceed to load the main window
  setTimeout(async () => {
    await createMainWindow();
    splashWindow.close();
  }, 5000); // Show splash screen for 5 seconds

  ipcManager();
});

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { 
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  mainWindow.webContents.once('did-finish-load', () => { // Ensure this function is asyn
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools(); // Open DevTools in development mode
    }
  });

    // Handle checking authentication status
    ipcMain.on('check-auth-status', async (event) => {
      try {
        const [googleTokens, msTokens] = await Promise.all([
          keytar.getPassword(SERVICE_NAME, GOOGLE_ACCOUNT_NAME),
          keytar.getPassword(SERVICE_NAME, MS_ACCOUNT_NAME),
        ]);
        const isLoggedIn = !!(googleTokens || msTokens);
        event.sender.send('auth-status', isLoggedIn); // Send 'auth-status' event with the result
      } catch (error) {
        console.error('Error checking auth status:', error);
        event.sender.send('auth-status', false); // Assume not logged in if there’s an error
      }
    });

  try {
    console.log('Retrieving tokens from keychain...');
    const [googleTokens, googleUniqueId, msTokens, msUniqueId] = await Promise.all([
      keytar.getPassword(SERVICE_NAME, GOOGLE_ACCOUNT_NAME),
      keytar.getPassword(SERVICE_NAME, GOOGLE_UNIQUE_ID_KEY),
      keytar.getPassword(SERVICE_NAME, MS_ACCOUNT_NAME),
      keytar.getPassword(SERVICE_NAME, MS_UNIQUE_ID_KEY),
    ]);

    console.log('Tokens retrieved:', { googleTokens, msTokens });

    if (googleTokens || msTokens) {
      console.log('Tokens found, loading main page...');
      mainWindow.loadURL(`${BASE_URL}/home`);
      mainWindow.webContents.once('did-finish-load', async () => {
        // Handle tokens if they exist
        if (googleTokens) {
          const tokens = JSON.parse(googleTokens);
          mainWindow.webContents.send('auth-success', { tokens, uniqueId: googleUniqueId });
      
          // Initial token check and setup
          await checkAndRefreshGoogleToken(tokens);
          validateGoogleToken(tokens).then(isValid => {
              mainWindow.webContents.send('token-validity', isValid);
      
              if (isValid) {
                  console.log('Token validation successful');
              } else {
                  console.error('Token validation failed');
              }
          });
      
          // Periodically refresh token and revalidate it every 15 minutes
          setInterval(async () => {
              await checkAndRefreshGoogleToken(tokens);
              
              validateGoogleToken(tokens).then(isValid => {
                  mainWindow.webContents.send('token-validity', isValid);
      
                  if (isValid) {
                      console.log('Writing token to store... ', tokens);
                      store.set('googleTokens', tokens);
                      console.log('Tokens refreshed successfully');
                  } else {
                      console.error('Unable to refresh tokens');
                  }
              });
          }, 15 * 60 * 1000);
      
      
        } else if (msTokens) {
          const { tokens, account } = JSON.parse(msTokens);
          mainWindow.webContents.send('auth-success', { tokens, uniqueId: msUniqueId });
          validateMsToken(tokens.accessToken).then(isValid => {
            mainWindow.webContents.send('token-validity', isValid);
          }).catch(error => {
            console.error('Token validation error:', error);
          });
        }
      });
    } else {
      console.log('No tokens found, loading login window...');
      mainWindow.loadURL(`${BASE_URL}/login`);
    }
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    mainWindow.loadURL(`${BASE_URL}/login`);
  }

  ipcMain.on('auth-start', async (event, provider) => {
    if (provider === 'google') {
      startGoogleAuth(mainWindow);
    } else if (provider === 'microsoft') {
      startMicrosoftAuth(mainWindow);
    }
  });

  ipcMain.on('logout', async () => {
    await Promise.all([
      keytar.deletePassword(SERVICE_NAME, GOOGLE_ACCOUNT_NAME),
      keytar.deletePassword(SERVICE_NAME, GOOGLE_UNIQUE_ID_KEY),
      keytar.deletePassword(SERVICE_NAME, MS_ACCOUNT_NAME),
      keytar.deletePassword(SERVICE_NAME, MS_UNIQUE_ID_KEY),
      store.delete('userInfo'),
    ]);
    mainWindow.webContents.send('logout-success');
    console.log('Stored tokens cleared');
    mainWindow.loadURL(`${BASE_URL}/login`);
  });
}

const startGoogleAuth = async (mainWindow) => {
  const client = initGoogleOAuthClient();
  const url = client.generateAuthUrl({
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'     // For user's email address
    ],
  });
  const authWindow = new BrowserWindow({ x: 60, y: 60, useContentSize: true });
  authWindow.loadURL(url);

  authWindow.on('closed', () => {
    mainWindow.webContents.send('auth-window-closed');
  });

  const code = await getOAuthCodeByInteraction(authWindow, url);
  const response = await client.getToken(code);
  const uniqueId = crypto.randomUUID();

  await keytar.setPassword(SERVICE_NAME, GOOGLE_ACCOUNT_NAME, JSON.stringify(response.tokens));
  await keytar.setPassword(SERVICE_NAME, GOOGLE_UNIQUE_ID_KEY, uniqueId);

  console.log('Google Auth Success:', response.tokens);
  console.log('Writing tokens to store... ', response.tokens);

  store.set('googleTokens', response.tokens);

  mainWindow.webContents.send('auth-success', { tokens: response.tokens, uniqueId });

  const isValid = await validateGoogleToken(response.tokens);
  mainWindow.webContents.send('token-validity', isValid);
};

const startMicrosoftAuth = async (mainWindow) => {
  const msalConfig = {
    auth: {
      clientId: MICROSOFT_OAUTH_CLIENT.clientId,
      authority: `https://login.microsoftonline.com/${MICROSOFT_OAUTH_CLIENT.tenantId}`,
      redirectUri: 'msal://auth',
    },
  };

  const pca = new msal.PublicClientApplication(msalConfig);

  const authCodeUrlParameters = {
    scopes: ["user.read", "offline_access"],
    redirectUri: 'msal://auth',
    prompt: "select_account"
  };

  try {
    const authUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
    authWindow = new BrowserWindow({ x: 60, y: 60, useContentSize: true });
    authWindow.loadURL(authUrl);

    authWindow.on('closed', () => {
      mainWindow.webContents.send('auth-window-closed');
    });
  } catch (error) {
    console.error('Error getting auth URL:', error);
  }
};

const handleMicrosoftAuthCode = async (code) => {
  const msalConfig = {
    auth: {
      clientId: MICROSOFT_OAUTH_CLIENT.clientId,
      authority: `https://login.microsoftonline.com/${MICROSOFT_OAUTH_CLIENT.tenantId}`,
      redirectUri: 'msal://auth',
    },
  };

  const pca = new msal.PublicClientApplication(msalConfig);
  const tokenRequest = {
    code: code,
    scopes: ["user.read", "offline_access"],
    redirectUri: 'msal://auth',
  };

  try {
    const response = await pca.acquireTokenByCode(tokenRequest);
    const uniqueId = crypto.randomUUID();
    const account = response.account;

    await keytar.setPassword(SERVICE_NAME, MS_ACCOUNT_NAME, JSON.stringify({ tokens: response, account: account }));
    await keytar.setPassword(SERVICE_NAME, MS_UNIQUE_ID_KEY, uniqueId);
    mainWindow.webContents.send('auth-success', { tokens: response, uniqueId });

    if (authWindow) {
      authWindow.close();
      authWindow = null;
    }

    const isValid = await validateMsToken(response.accessToken);
    mainWindow.webContents.send('token-validity', isValid);
  } catch (error) {
    console.error('Error during token acquisition:', error);
    mainWindow.webContents.send('token-validity', false);
  }
};

const initGoogleOAuthClient = () => {
  return new OAuth2Client({
    clientId: GOOGLE_OAUTH_CLIENT.clientId,
    clientSecret: GOOGLE_OAUTH_CLIENT.clientSecret,
    redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
  });
};

const getOAuthCodeByInteraction = (interactionWindow, authPageURL) => {
  return new Promise((resolve, reject) => {
    interactionWindow.loadURL(authPageURL);
    const onclosed = () => {
      reject('Interaction ended intentionally ;(');
    };
    interactionWindow.on('closed', onclosed);
    interactionWindow.webContents.on('did-navigate', (event, url) => {
      handleURLChange(url, interactionWindow, resolve, reject, onclosed);
    });
    interactionWindow.webContents.on('page-title-updated', (event) => {
      const url = interactionWindow.webContents.getURL();
      handleURLChange(url, interactionWindow, resolve, reject, onclosed);
    });
  });
};

const handleURLChange = (url, interactionWindow, resolve, reject, onclosed) => {
  const parsedURL = new URL(url);
  if (parsedURL.searchParams.get('approvalCode')) {
    interactionWindow.removeListener('closed', onclosed);
    interactionWindow.close();
    return resolve(parsedURL.searchParams.get('approvalCode'));
  }
  if (parsedURL.searchParams.get('code')) {
    interactionWindow.removeListener('closed', onclosed);
    interactionWindow.close();
    return resolve(parsedURL.searchParams.get('code'));
  }
  if ((parsedURL.searchParams.get('response') || '').startsWith('error=')) {
    interactionWindow.removeListener('closed', onclosed);
    interactionWindow.close();
    return reject(parsedURL.searchParams.get('response'));
  }
};

const validateGoogleToken = async (tokens) => {
  const client = new OAuth2Client();
  client.setCredentials(tokens);

  try {
    const res = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });
    const userInfo = res.data;
    console.log('User Info:', userInfo);

    // Cache user info which will also save profile picture in Electron Store
    await cacheUserInfo(userInfo);

    // Send user info to Angular frontend
    mainWindow.webContents.send('user-info', userInfo);

    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};

const validateMsToken = async (accessToken) => {
  const url = "https://graph.microsoft.com/v1.0/me";

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Token validation failed: ${errorText}`);
      throw new Error('Token validation failed');
    }

    const userInfo = await response.json();
    console.log('User Info:', userInfo); // Log the user info to verify

    // Store user info in MongoDB and cache in SQLite
    await storeUserInfo(userInfo);
    cacheUserInfo(userInfo);

    mainWindow.webContents.send('user-info', userInfo);
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

app.on('window-all-closed', () => {
  app.quit();
});

module.exports = { validateGoogleToken };

