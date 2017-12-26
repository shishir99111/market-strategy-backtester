const uploadHistoricalData = require('./uploadHistoricalData.handler');

/**
 * Mounts component specific routes,
 * along with there respective route handlers
 * @param {object} router
 */
module.exports = (router) => {
  router.post('/historical-data', uploadHistoricalData);
};