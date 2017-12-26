const router = require('express').Router();
const path = require('path');

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

require('./api/batchUpload')(router);

/**
 * Appends different routes to the
 * router and exports it.
 * @returns {object} express router instance
 */
module.exports = () => {
  return router;
};