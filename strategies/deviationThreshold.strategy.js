const Boom = require('boom');

const { TREND, PREFIX } = rootRequire('commons/constants');

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

function preIterationAnalysis(config, prevData) {
  if (prevData.Trend === TREND['POSITIVE']) config.prevTrend = TREND['POSITIVE'];
  if (prevData.Trend === TREND['NEGATIVE']) config.prevTrend = TREND['NEGATIVE'];
  return config;
}

function postIterationAnalysis(config, data) {
  if (data.Trend === TREND['POSITIVE'] && config.prevTrend === TREND['POSITIVE']) {
    config.lotSizeX = 2;
  }
  if (data.Trend === TREND['NEGATIVE'] && config.prevTrend === TREND['NEGATIVE']) {
    config.lotSizeX = 1;
    config.TrendNeutral = 1;
  }
  return config;
}

function findThresholdTicks(data, input) {
  const result = [];
  let config = {
    prevTrend: null,
    lotSizeX: 1, // lot size for order placement 1x, 2x...
  };

  let basePoint = data[0];
  let positiveCount = 0;
  let negativeCount = 0;
  for (let i = 0; i < data.length; i++) {
    const positiveAssert = isUpperThresholdCrossed(data[i], basePoint, input.upper);
    const negativeAssert = isLowerThresholdCrossed(data[i], basePoint, input.lower);

    config = preIterationAnalysis(config, data[i - 1] || data[0]);

    data[i].NoOfOrders = config.lotSizeX;

    if (positiveAssert) {
      data[i].Type = `${PREFIX['POSITIVE']}${positiveCount += config.lotSizeX}`;
      data[i].Trend = TREND['POSITIVE'];
      // config.prevTrend = TREND['POSITIVE'];
      result.push(data[i]);
      basePoint = data[i];
    } else if (negativeAssert) {
      data[i].Type = `${PREFIX['NEGATIVE']}${negativeCount += config.lotSizeX}`;
      data[i].Trend = TREND['NEGATIVE'];
      // config.prevTrend = TREND['NEGATIVE'];
      result.push(data[i]);
      basePoint = data[i];
    }

    config = postIterationAnalysis(config, data[i]);
  }
  return result;
}

function handler(data, { call: callConfig, put: putConfig }) {
  try {
    const callResult = findThresholdTicks(data['Call Data'], callConfig);
    const putResult = findThresholdTicks(data['Put Data'], putConfig);

    return { callResult, putResult };
  } catch (e) {
    throw Boom.badRequest(e);
  }
}

module.exports = handler;