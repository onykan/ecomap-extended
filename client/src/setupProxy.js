const { createProxyMiddleware } = require('http-proxy-middleware');

// TODO: not loading the env vars
// require('dotenv').config({ path: '../../.env' });
const PROXY = process.env.REACT_APP_PROXY || 'localhost:3001';
const targetServer = `http://${PROXY}/api`;

module.exports = function(app) {
  console.log(`Proxy on ${targetServer}`)
  app.use(
    '/api',
    createProxyMiddleware({
      target: targetServer,
      changeOrigin: true,
    })
  );
};
