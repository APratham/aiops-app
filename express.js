const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const rateLimit = require('express-rate-limit');
const dalRoutes = require('./data-layer/expressDal'); 

const app = express();
const port = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'www')));


const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use('/api', apiLimiter); 

app.use('/api', (req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  console.log(`Authorization header: ${req.headers['authorization']}`);
  next();
}, 
createProxyMiddleware({  // This is where createProxyMiddleware is being used
  target: 'http://localhost:8000',
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  onProxyReq: (proxyReq, req, res) => {
    console.log('Forwarding request to backend');
    if (req.headers['authorization']) {
      proxyReq.setHeader('Authorization', req.headers['authorization']);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(504).send('Proxy error: Unable to reach the backend service');
  },
}));


app.use('/dal', dalRoutes); 


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
