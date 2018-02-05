## Market Strategy Backtester

[![PRs Welcome](https://img.shields.io/badge/prs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

- An Implementation for testing market trading automation strategy with the historical data. 
    PS: Originaly built to revive my trading strategy.

## Requirements

- Nodejs ^v8.9.0

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

- Provide Sample Data File.
- Validation for inputs.
- Data from Zerodha
- DeviationThreshold Strategy.
    - Exit Strategy.
    - Frequency Calculations.
    - Bidirectional Structure. i.e.
    reversal in case of consequitive negatives and push back to original state when again consequitive positive comes.
    Whole motive is to reduce the negative calls and increase positive.
