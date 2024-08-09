const path = require('path');

module.exports = {
  resolve: {
    fallback: {
      "fs": false,            // Do not include the 'fs' module
      "path": false,          // Do not include the 'path' module
      "crypto": false,        // You can add more fallbacks if necessary
      "net": false,           // Optional: If 'net' is being used
      "tls": false,           // Optional: If 'tls' is being used
    }
  },
  externals: {
    electron: 'electron'      // Prevent 'electron' from being bundled
  }
};
