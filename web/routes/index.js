const { KiteConnect, KiteTicker } = require('kiteconnect');
const router = require('express').Router();
const path = require('path');

/**
 * Appends different routes to the
 * router and exports it.
 * @returns {object} express router instance
 */
module.exports = (server) => {
  const io = require('socket.io')(server); // eslint-disable-line

  // routes loaded
  router.get('/', (req, res) => {
    res.json({
      success: true,
      version: 'v1.0.0',
    });
  });

  router.get('/dashboard', (req, res) => {
    return res.render(path.resolve('view/index.ejs'), {
      apiKey: process.env.ZERODHA_API_KEY,
    });
  });

  router.get('/auth', (req, res) => {
    if (req.query.status === 'success') {

      const kc = new KiteConnect(process.env.ZERODHA_API_KEY);
      kc.requestAccessToken(req.query.request_token, process.env.ZERODHA_API_SECRET).then((response) => {
        global = {}; // eslint-disable-line
        global.kc = kc;
        global.access_token = response.data.access_token;
        global.public_token = response.data.public_token;
      });
      return res.render(path.resolve('view/index.ejs'), {
        apiKey: process.env.ZERODHA_API_KEY,
        request_token: req.request_token,
      });
    }
    return res.render('view/error.ejs', { error: req.query.message || 'unexpected error' });
  });

  return router;
};