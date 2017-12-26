const { KiteConnect, KiteTicker } = require('kiteconnect');
const path = require('path');

/**
 * Mounts component specific routes,
 * along with there respective route handlers
 * @param {object} router
 */
module.exports = (router) => {
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
};