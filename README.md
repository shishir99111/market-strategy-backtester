## Market Strategy Backtester

- A implementation for testing market trading automation with the historical data.

## Requirements

- Nodejs ^v8.9.0
- MongoDB

## Installation

* Clone repository
* npm install
* npm install --save-dev eslint-config-airbnb-base eslint eslint-plugin-import
* create .env with below mentioned contents
* npm start

> Create .env file

```
# NODE
PORT=50500
NODE_ENV=development
LOGGER_LEVEL=trace
DB=backtester-development
DB_URI=localhost:27017

ZERODHA_API_KEY=<YOUR ZERODHA KEY>
ZERODHA_API_SECRET=<YOUR ZERODHA SECRET>
ZERODHA_USER_ID=<YOUR ZERODHA USER ID>
```

# Todo:

- Excel upload for the historical data, in the stadard format provided by zerodha portal.
