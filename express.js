const express = require('express');
const path = require('path');
const httpProxy = require('http-proxy');

const rateLimit = require('express-rate-limit');
const dalRoutes = require('./data-layer/expressDal'); // Import DAL routes
const proxy = httpProxy.createProxyServer({});

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'www' directory
app.use(express.static(path.join(__dirname, 'www')));

// Apply rate limiting to API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use('/api', apiLimiter); // Apply rate limiting to the /api route

// Proxy API requests to the FastAPI backend
app.use('/api', (req, res) => {

  // Log the full URL that Express is sending the request to
  console.log(`Proxying request to: ${req.url}`);

  proxy.web(req, res, { target: 'http://0.0.0.0:8000', timeout: 10000 }, (err) => {
    console.error(err);
    res.status(502).send('Bad Gateway');
  });
});

app.use('/dal', dalRoutes); // All DAL-related routes are prefixed with /dal

// Catch-all route to serve the Angular app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
