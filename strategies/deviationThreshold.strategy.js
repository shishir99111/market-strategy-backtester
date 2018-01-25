const Boom = require('boom');

const errorPoint = 0.0;

function isThresholdCrossed(val, basePoint, threshold) {
  // const _val = Number(val);
  // const _basePoint = Number(basePoint);
  // const +threshold = Number(threshold);
  return +val['Offer'] >= ((+basePoint['Offer'] + +threshold) - errorPoint) ||
    +val['Offer'] >= ((+basePoint['Bid'] + +threshold) - errorPoint) ||
    +val['Offer'] <= ((+basePoint['Offer'] - +threshold) + errorPoint) ||
    +val['Offer'] <= ((+basePoint['Bid'] - +threshold) + errorPoint) ||
    +val['Bid'] >= ((+basePoint['Offer'] + +threshold) - errorPoint) ||
    +val['Bid'] >= ((+basePoint['Bid'] + +threshold) - errorPoint) ||
    +val['Bid'] <= ((+basePoint['Offer'] - +threshold) + errorPoint) ||
    +val['Bid'] <= ((+basePoint['Bid'] - +threshold) + errorPoint);
}

function findThresholdTicks(data, threshold) {
  const result = [];
  let basePoint = data[0];
  for (let i = 0; i < data.length; i++) {
    const assert = isThresholdCrossed(data[i], basePoint, threshold);
    if (assert) {
      result.push(data[i]);
      basePoint = data[i];
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