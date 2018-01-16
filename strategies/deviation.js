const Boom = require('boom');

const errorPoint = 0.0;

function isThresholdCrossed(val, basePoint, threshold) {
  return (val >= ((basePoint + threshold) - errorPoint) || val <= ((basePoint - threshold) + errorPoint));
}

function handler(data, threshold) {
  try {
    let result = [];
    const callData = data['Call Data'];
    const putData = data['Put Data'];

    let basePoint = callData[0]['Offer'];
    for (let i = 0; i < callData.length; i++) {
      if (isThresholdCrossed(callData[i]['Bid'], basePoint, threshold)) {
        result.push(callData[i]);
        basePoint = callData[i]['Bid'];
      } else if (isThresholdCrossed(callData[i]['Offer'], basePoint, threshold)) {
        result.push(callData[i]);
        basePoint = callData[i]['Offer'];
      }
    }
    return result;
  } catch (e) {
    return Boom.badRequest(e);
  }
}

module.exports = handler;