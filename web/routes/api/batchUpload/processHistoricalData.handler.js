const co = require('co');
const Boom = require('boom');

const { processXlsx } = rootRequire('service');
const logic = rootRequire('strategies/deviationThreshold.strategy');

function getUserInputObj(body) {
  return {
    call: {
      upper: body.upper_call_threshold,
      lower: body.lower_call_threshold,
    },
    put: {
      upper: body.upper_put_threshold,
      lower: body.lower_put_threshold,
    },
    consequitive_count: {
      positive: body.positive_consequitive_count,
      negative: body.positive_consequitive_count,
    },
  };
}

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
      // need to add Joi validation
      const userInput = getUserInputObj(req.body);

      const worksheet = yield processXlsx({
        path: '/uploads/',
        filename: req.file.filename,
      }, ['Call Data', 'Put Data']);

      const result = logic(worksheet, userInput);

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