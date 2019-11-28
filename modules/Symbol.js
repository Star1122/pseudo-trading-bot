const bitfinex = require('./bitfinex');

module.exports = class Symbol {
  constructor(config) {
    this.tradingPair = config.tradingPair;
    this.meta = {};
  }

  async init() {
    try {
      const symbolDetails = await bitfinex.symbolDetails();
      symbolDetails.forEach((symbol) => {
        if (symbol.pair === this.tradingPair.toLowerCase()) {
          return this.meta = Object.assign(this.getters(), symbol);
        }
      });
      return true;
    } catch (err) {
      console.log('SYMBOL ERROR: ', err.message);
      return false;
    }
  }

  getters() {
    return {
      get minQty() {
        return Number(this.filters[1].minQty);
      },
      get maxQty() {
        return Number(this.filters[1].maxQty);
      },
      get stepSize() {
        return Number(this.filters[1].stepSize);
      },
    };
  }
};
