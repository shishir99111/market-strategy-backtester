const whitelistedIp = process.env.Whitelisted_IP;

module.exports = (req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  let whitelisted = false;
  whitelisted = whitelistedIp.some(v => clientIp.indexOf(v) > -1);

  // // ip whitelisting
  // if (!whitelisted ) {
  //     const error = new Error(`UnAuthorised to access this API | clientIp: ${clientIp}`);
  //     error.name = 'unAuthorized';
  //     return next(error);
  // }
  return next();
};