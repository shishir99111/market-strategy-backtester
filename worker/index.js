const path = require('path');
const { KiteConnect, KiteTicker } = require('kiteconnect');

module.exports = (server) => {
  const io = require('socket.io')(server);

  io.on('connection', (socket) => {
    logger.info('new connection', socket.id);

    const apiKey = process.env.ZERODHA_API_KEY;
    const userId = process.env.ZERODHA_USER_ID;
    const publicToken = global.public_token;
    const ticker = new KiteTicker(apiKey, userId, publicToken);

    function setTick(ticks) {
      logger.info('Ticker updates received');
      socket.emit('tick', ticks[0]);
    }

    // testing schedular
    if (process.env.testing) {
      let i = 0;
      const scheduler = setInterval(() => {
        i += 1;
        socket.emit('tick', { proc: 'testing', testCount: i });
        if (i === 10) {
          clearInterval(scheduler);
        }
      }, 3000);
    }

    function subscribe() {
      const items = [738561];
      ticker.subscribe(items);
      ticker.setMode(ticker.modeFull, items);
    }

    ticker.connect();
    ticker.on('tick', setTick);
    ticker.on('connect', subscribe);
  });
};