module.exports = class Watchlist {
  constructor(config) {
    this.config = config.config;
    this.state = config.state;
    this.ticker = config.ticker;
    this.bot = config.bot;
    this.logger = config.logger;
    this.meta = {
      watchlist: {}
    };
  }

  init() {
    this.meta = Object.assign(this.getters(), this.meta);
  }

  add(orderId, txn) {
    this.meta.watchlist[orderId] = txn;
  }

  remove(orderId) {
    delete this.meta.watchlist[orderId];
  }

  // watch for any triggers i.e STOP_LIMIT_PERCENTAGE, PROFIT_LOCK_PERCENTAGE,
  // and repopulate queue accordingly via this.bot.sell()
  watch() {
    const { watchlist } = this.meta;
    const { config } = this;
    const { state } = this;

    for (const orderId in watchlist) {
      const order = watchlist[orderId];
      const orderPrice = Number(order.price);
      const orderQuantity = Number(order.quantity);
      const currentPrice = this.ticker.meta.bid;
      let shouldSell = false;

      if (currentPrice >= (orderPrice + (orderPrice * config.profitPercentage))) {
        shouldSell = true; // profit percentage trigger
      }

      if (state.paranoid && (currentPrice <= orderPrice + (orderPrice * config.profitLockPercentage))) { // profit lock trigger
        console.log(' [ALARM]::: Price dipped below PROFIT_LOCK_PERCENTAGE while in paranoid mode. Selling.');
        state.profitLockPercentageMet = true; // used for mocha testing
        shouldSell = true;
      }

      if (config.profitLockPercentage && (currentPrice >= orderPrice + (orderPrice * config.profitLockPercentage))) { // profit lock trigger
        console.log(' [ALARM]::: PROFIT_LOCK_PERCENTAGE REACHED. Now in paranoid mode.');
        state.paranoid = true;
      }

      if (config.stopLimitPercentage && (currentPrice <= orderPrice - (orderPrice * config.stopLimitPercentage))) { // stop limit trigger
        console.log(' [ALARM]::: STOP_LIMIT_PERCENTAGE REACHED. Exiting position.');
        state.stopLimitPercentageMet = true;
        shouldSell = true;
      }

      if (shouldSell) {
        this.bot.sell(orderQuantity, currentPrice);
        state.paranoid = false;
        this.remove(orderId);
      }
    }
  }

  getters() {
    return {
      get length() { return Object.keys(this.watchlist).length; }
    };
  }
};
