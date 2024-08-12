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
*/

const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const { OAuth2Client } = require('google-auth-library');
const { GOOGLE_OAUTH_CLIENT, MICROSOFT_OAUTH_CLIENT } = require('./secrets');
const msal = require('@azure/msal-node');
const crypto = require('crypto');
const keytar = require('keytar');
const Store = require('electron-store');
const fetch = require('node-fetch');
const URL = require('url').URL;
const path = require('path');

const { connectMongoDB, storeUserInfo, cacheUserInfo } = require('./data-layer/dal');
const dal = require('./data-layer/dal');

const SERVICE_NAME = 'ElectronOAuthExample';
const GOOGLE_ACCOUNT_NAME = 'google-oauth-token';
const GOOGLE_UNIQUE_ID_KEY = 'google-unique-id';
const MS_ACCOUNT_NAME = 'ms-oauth-token';
const MS_UNIQUE_ID_KEY = 'ms-unique-id';

// Store the base URL in a variable
const BASE_URL = 'http://localhost:3000';
const store = new Store();

let mainWindow;
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
  const profilePic = dal.getProfilePicFromStore();
  event.returnValue = profilePic;
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

  setTimeout(async () => {
    await createMainWindow();
    splashWindow.close();
  }, 5000); // Show splash screen for 5 seconds
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

  mainWindow.webContents.once('did-finish-load', () => {
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
      console.log('Tokens found, loading dashboard...');
      mainWindow.loadURL(`${BASE_URL}/dashboard`);
      mainWindow.webContents.once('did-finish-load', () => {
        // Handle tokens if they exist
        if (googleTokens) {
          const tokens = JSON.parse(googleTokens);
          mainWindow.webContents.send('auth-success', { tokens, uniqueId: googleUniqueId });
          validateGoogleToken(tokens).then(isValid => {
            mainWindow.webContents.send('token-validity', isValid);
          });
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
    scope: ['https://www.googleapis.com/auth/userinfo.profile'],
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

