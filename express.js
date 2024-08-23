const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const rateLimit = require('express-rate-limit');
const morgan = require('morgan'); // Use morgan for logging
const dalRoutes = require('./data-layer/expressDal'); // Import DAL routes


const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'www' directory
app.use(express.static(path.join(__dirname, 'www')));

// Apply rate limiting to API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res, /* next */) => {
    res.status(429).send('Too many requests from this IP, please try again after 15 minutes');
  },
});


app.use('/api', apiLimiter); // Apply rate limiting to the /api route

// Use morgan for logging requests
app.use(morgan((tokens, req, res) => {
  const remaining = req.rateLimit ? req.rateLimit.remaining : 'N/A';
  return [
    `[0] INFO:`,
    tokens['remote-addr'](req, res),
    '-',
    `"${tokens.method(req, res)} ${tokens.url(req, res)} HTTP/${tokens['http-version'](req, res)}"`,
    tokens.status(req, res),
    tokens['response-time'](req, res), 'ms',
    `- ${tokens.res(req, res, 'content-length') || 0} bytes`,
    `- ${remaining} requests remaining`
  ].join(' ');
}));

// Proxy API requests to the FastAPI backend
app.use('/api', createProxyMiddleware({
  target: 'http://0.0.0.0:8000', // FastAPI backend URL
  changeOrigin: true,
  timeout: 5000,
  proxyTimeout: 5000,
}));

app.use('/dal', dalRoutes); // All DAL-related routes are prefixed with /dal

// Health check route
app.get('/status', (req, res) => {
  res.json({ status: 'ok', service: 'Express Server', port: port });
});

// Catch-all route to serve the Angular app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
