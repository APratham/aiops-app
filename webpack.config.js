const path = require('path');

module.exports = {
  resolve: {
    fallback: {
      "fs": require.resolve("fs-browserify"),
      "path": require.resolve("path-browserify"),
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
