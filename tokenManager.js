const { OAuth2Client } = require('google-auth-library');
const { GOOGLE_OAUTH_CLIENT } = require('./secrets');

const REFRESH_TOKEN_THRESHOLD = 300; // 5 minutes

// Initialize the Google OAuth2 client with client ID, client secret, and redirect URI
const initGoogleOAuthClient = () => {
  return new OAuth2Client({
    clientId: GOOGLE_OAUTH_CLIENT.clientId,
    clientSecret: GOOGLE_OAUTH_CLIENT.clientSecret,
    redirectUri: 'urn:ietf:wg:oauth:2.0:oob',  // The redirect URI for out-of-band authentication
  });
};


const checkAndRefreshGoogleToken = async (tokens) => {
  
  console.log('Checking Google token...');

  if (!tokens || !tokens.expiry_date) {
    console.log('No valid tokens available');
    return;
  }

  const client = initGoogleOAuthClient();  // Use the initialized OAuth2 client
  client.setCredentials(tokens);

  // Simulate the token is about to expire for testing
  tokens.expiry_date = Date.now() + 30 * 1000;  

  const expiryDate = tokens.expiry_date;
  const timeUntilExpiry = expiryDate - Date.now();

  if (timeUntilExpiry < REFRESH_TOKEN_THRESHOLD * 1000) {
    // Token is about to expire, refresh it
    try {
      const newTokens = await refreshGoogleAccessToken(client, tokens.refresh_token);
      // Update the tokens object that was passed
      Object.assign(tokens, newTokens);
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  } else {
    console.log('Token is still valid');
  }
};

const refreshGoogleAccessToken = async (client, refreshToken) => {
  const { tokens } = await client.refreshToken(refreshToken);
  return tokens;
};

// Export functions to be used in main.js
module.exports = { checkAndRefreshGoogleToken };
