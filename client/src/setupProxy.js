const { createProxyMiddleware } = require('http-proxy-middleware');

require('dotenv').config({ path: '../.env' });
const PROXY = process.env.REACT_APP_PROXY || 'localhost:3001';
const targetServer = `http://${PROXY}`;
const routes = ['/api', '/uptime'];

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
