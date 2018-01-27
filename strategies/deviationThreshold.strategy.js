const Boom = require('boom');

const errorPoint = 0.0;

function isUpperThresholdCrossed(val, basePoint, threshold) {
  return +val['Offer'] >= ((+basePoint['Offer'] + +threshold) - errorPoint) ||
    +val['Offer'] >= ((+basePoint['Bid'] + +threshold) - errorPoint) ||
    +val['Bid'] >= ((+basePoint['Offer'] + +threshold) - errorPoint) ||
    +val['Bid'] >= ((+basePoint['Bid'] + +threshold) - errorPoint);
}

function isLowerThresholdCrossed(val, basePoint, threshold) {
  return +val['Offer'] <= ((+basePoint['Offer'] - +threshold) + errorPoint) ||
    +val['Offer'] <= ((+basePoint['Bid'] - +threshold) + errorPoint) ||
    +val['Bid'] <= ((+basePoint['Offer'] - +threshold) + errorPoint) ||
    +val['Bid'] <= ((+basePoint['Bid'] - +threshold) + errorPoint);
}

function findThresholdTicks(data, threshold) {
  const result = [];
  let basePoint = data[0];
  let positiveCount = 0;
  let negativeCount = 0;
  for (let i = 0; i < data.length; i++) {
    const positiveAssert = isUpperThresholdCrossed(data[i], basePoint, threshold.upper);
    const negativeAssert = isLowerThresholdCrossed(data[i], basePoint, threshold.lower);
    if (positiveAssert) {
      data[i].Type = `PC${positiveCount += 1}`;
      result.push(data[i]);
      basePoint = data[i];
    } else if (negativeAssert) {
      data[i].Type = `NC${negativeCount += 1}`;
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