const Boom = require('boom');

const errorPoint = 0.0;

function isThresholdCrossed(val, basePoint, threshold) {
  return (val['Offer'] >= ((basePoint + threshold) - errorPoint) || val['Offer'] <= ((basePoint - threshold) + errorPoint)) ||
  (val['Bid'] >= ((basePoint + threshold) - errorPoint) || val['Bid'] <= ((basePoint - threshold) + errorPoint));
}

function findThresholdTicks(data, threshold) {
  const result = [];
  let basePoint = {
    offer: data[0]['Offer'],
    bid: data[0]['Bid'],
  };
  for (let i = 0; i < data.length; i++) {
    const assert = isThresholdCrossed(data[i], basePoint, threshold);
    if (assert) {
      result.push(data[i]);
      basePoint = assert;
    }
  }
  return result;
}

function handler(data, threshold) {
  try {
    const callData = data['Call Data'];
    const putData = data['Put Data'];

    const callResult = findThresholdTicks(callData, threshold.call);
    const putResult = findThresholdTicks(putData, threshold.put);

    return { callResult, putResult };
  } catch (e) {
    return Boom.badRequest(e);
  }
}

module.exports = handler;