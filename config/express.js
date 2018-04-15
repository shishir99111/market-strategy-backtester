/**
 * Setting basic configurations for Express and only expose app (express) object
 * for further processing.
 */
const express = require('express');

const app = express();

module.exports = () => {
  // disabled for security reasons
  app.disable('x-powered-by');
  app.set('etag', false);

  app.use(express.static('./view'));

  app.get(['/favicon.ico', '/robot.txt'], (req, res) => { res.status(204); });

  return app;
};