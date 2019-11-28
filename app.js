/**
 * Module dependencies.
 */
global.Promise = require('bluebird');
const chalk = require('chalk');

const app = require('./config/express');
const mongoose = require('./config/mongoose');
const Bot = require('./modules/Bot.js');

mongoose.connect();

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');

  const config = {
    tradingPair: process.env.TARGET_ASSET + process.env.BASE_ASSET,
    profitPercentage: Number(process.env.PROFIT_PERCENTAGE) / 100,
    budget: Number(process.env.BUDGET),
    compound: process.env.COMPOUND.toLowerCase() === "true",
    profitLockPercentage: Number(process.env.PROFIT_LOCK_PERCENTAGE) / 100,
    stopLimitPercentage: Number(process.env.STOP_LIMIT_PERCENTAGE) / 100
  };

  const bot = new Bot(config);
});

module.exports = app;
