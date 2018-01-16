const uploadHistoricalData = require('./processHistoricalData.handler');

const multer = rootRequire('web/middleware/multer');

/**
 * Mounts component specific routes,
 * along with there respective route handlers
 * @param {object} router
 */
module.exports = (router) => {
  router.post('/historical-data', multer.historyData, uploadHistoricalData);
};