const bitfinex = require('./bitfinex');

module.exports = class Ticker {
  constructor(config) {
    this.tradingPair = config.tradingPair;
    this.callbacks = config.callbacks;
  }

  init() {
    return new Promise((resolve, reject) => {
      try {
        bitfinex.ticker(`t${this.tradingPair}`)
          .then((ticker) => {
            const temp = {
              bidPrice: this.godMode.bid || ticker.BID,
              askPrice: this.godMode.ask || ticker.ASK
            };
            this.meta = Object.assign(this.getters(), temp);
            this.callbacks.forEach(cb => cb());
            resolve(true);
          })
          .catch((error) => {
            reject(error);
          });
      } catch (err) {
        reject(false);
      }
    });
  }

  getters() {
    return {
      get bid() {
        return Number(this.bidPrice);
      },
      get ask() {
        return Number(this.askPrice);
      }
    };
  }
};
