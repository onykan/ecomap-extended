const { createProxyMiddleware } = require('http-proxy-middleware');

require('dotenv').config({ path: '../.env' });
const PROXY = process.env.REACT_APP_PROXY || 'localhost';
const PROXY_PORT = process.env.REACT_APP_PROXY_PORT || '3001';
const targetServer = `http://${PROXY}:${PROXY_PORT}`;
const routes = ['/api', '/uptime', '/year'];

module.exports = function(app) {
  console.log(`Proxy on ${targetServer}`)
  routes.forEach((route) => {
    app.use(
      route,
      createProxyMiddleware({
        target: `${targetServer}${route}`,
        changeOrigin: true,
      })
    );
  });
};
