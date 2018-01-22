const co = require('co');
const Boom = require('boom');

const { processXlsx } = rootRequire('service');
const logic = rootRequire('strategies/deviationThreshold.strategy');

const THRESHOLD = {
  call: 5,
  put: 5,
};

/**
 * Processes:
 * - saves to batch collection, only unique combined with client has to be saved
 * - validates the payments
 * - saves the respective payments, only unique combined with client as to be saved
 * - updates the batch collection
 * - Also create beneficiary and remitter on the fly
 * also saves individual transactions
 * @param {any} body
 * @param {any} context
 */
function* handler(req, res) {
  if (req.file !== undefined) {
    try {
      const threshold = req.body.threshold || THRESHOLD;
      const worksheet = yield processXlsx({
        path: '/uploads/',
        filename: req.file.filename,
      }, ['Call Data', 'Put Data']);

      const result = logic(worksheet, threshold);

      return result;
    } catch (e) {
      logger.error(`Error parsing XLSX ${e}`);
      return Boom.badRequest(e);
    }
  } else {
    logger.error('Unable to upload file');
    return res.status(500).json({
      success: false,
      message: 'Unable to Upload file',
    });
  }
}

function init(req, res, next) {
  co(handler(req, res))
    .then((data) => {
      res.json(data);
    }).catch(err => next(err));
}
module.exports = init;