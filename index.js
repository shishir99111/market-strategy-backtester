require('dotenv').config();
require('./globals');
require('./config/mongoose').init();

const {
  app,
  server,
} = require('./web/server');

require('./commons/helpers/gracefullyShutDown')(server);

// exported for TESTING
module.exports = app;