const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://9r9f3lx5u4.execute-api.eu-west-2.amazonaws.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Elimina el prefijo /api al redirigir la solicitud
      },
    })
  );
};
