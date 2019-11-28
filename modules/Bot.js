const fs = require('fs');
const assert = require('assert');
const ora = require('ora');
const Symbol = require('./Symbol.js');
const Ticker = require('./Ticker.js');
const Queue = require('./Queue.js');
const Watchlist = require('./Watchlist.js');
const Logger = require('./Logger.js');
const { randomString } = require('../utils');

module.exports = class Bot {
  constructor(config) {
    this.config = config;
    this.symbol = null; // meta information about trading pair
    this.ticker = null; // bid/ask prices updated per tick
    this.queue = null; // queue for unfilled transactions
    this.watchlist = null; // orderId --> filledOrders map; as well as length
    this.logger = null; // terminal logging system
    this.state = {
      consuming: false,
      killed: false,
      netSpend: 0,
      paranoid: false,
      profitLockPercentageMet: false, // used for mocha testing
      stopLimitPercentageMet: false,
      get compound() { return this.netSpend <= 0 ? 0 : this.netSpend; }
    };
    this.init();
  }

  async init() {
    // setup/start logger
    this.logger = new Logger();
    this.logger.init();

    // get trading pair information
    this.symbol = new Symbol({ tradingPair: this.config.tradingPair });
    await this.symbol.init();

    // setup/start queue
    this.queue = new Queue({ tradingPair: this.config.tradingPair, logger: this.logger });
    this.queue.init();

    // setup ticker
    const tickerConfig = {
      tradingPair: this.config.tradingPair,
      callbacks: [
        () => this.consume()
      ]
    };
    this.ticker = new Ticker(tickerConfig);

    // setup/start watchlist
    const watchlistConfig = {
      config: this.config,
      state: this.state,
      ticker: this.ticker,
      logger: this.logger,
      bot: this
    };
    this.watchlist = new Watchlist(watchlistConfig);

    // start ticker
    await this.ticker.init();

    // start watchlist
    this.watchlist.init();

    this.hunt();
  }

  // execute bot
  hunt() {
    this.purchase();
  }

  // process the queue of open buy/sell orders
  async consume() {
    const { state } = this;
    const { logger } = this;

    if (state.killed) return;
    if (state.consuming) return;

    state.consuming = true;
    logger.status({ queueCount: this.queue.meta.length, watchCount: this.watchlist.meta.length });
    const filledOrders = this.queue.getters().orders;

    // populate watchlist with filled BUY orders and compound ALL filled orders if necessary
    for (const orderId in filledOrders) {
      const txn = filledOrders[orderId];
      const { side } = txn;
      const price = Number(txn.price);
      this.compound(side, price);
      if (side === 'BUY') this.watchlist.add(orderId, txn);
      logger.status({ queueCount: this.queue.meta.length, watchCount: this.watchlist.meta.length });
      if (!state.stopLimitPercentageMet && side === 'SELL') this.hunt();
    }

    this.watchlist.watch();

    state.consuming = false;
  }

  // calculate quantity of coin to purchase based on given budget from .env
  calculateQuantity() {
    const { logger } = this;
    logger.success('Calculating quantity... ');

    const symbol = this.symbol.meta;
    const minQuantity = symbol.minQty;
    const maxQuantity = symbol.maxQty;
    const { quantitySigFig } = symbol;
    const { stepSize } = symbol; // minimum quantity difference you can trade by
    const currentPrice = this.ticker.meta.ask;
    const budget = this.config.budget + this.state.compound;

    let quantity = minQuantity;
    while (quantity * currentPrice <= budget) quantity += stepSize;
    if (quantity * currentPrice > budget) quantity -= stepSize;
    if (quantity === 0) quantity = minQuantity;

    assert(quantity >= minQuantity && quantity <= maxQuantity, 'invalid quantity');

    logger.success(`Quantity Calculated: ${quantity.toFixed(quantitySigFig)}`);
    return quantity.toFixed(quantitySigFig);
  }

  // create buy order
  async purchase(price) {
    try {
      const symbol = this.symbol.meta;
      const { tickSize } = symbol; // minimum price difference can trade by
      const { priceSigFig } = symbol;
      const { quantitySigFig } = symbol;
      const quantity = this.calculateQuantity();
      const price = (price && price.toFixed(priceSigFig)) || (this.ticker.meta.ask).toFixed(priceSigFig);

      const buyOrder = {
        orderId: randomString(40),
        symbol: this.config.tradingPair,
        side: 'BUY',
        quantity,
        price
      };

      this.queue.push(buyOrder);

      // Placing order
      this.logger.info('Place order: ');
      this.logger.info(`Symbol: ${this.config.tradingPair}`);
      this.logger.info('Side: BUY');
      this.logger.info(`Amount: ${quantity}`);
      this.logger.info(`Price: ${price}`);

      this.logger.success(`Purchasing... ${symbol}`);
    } catch (err) {
      console.log('PURCHASE ERROR: ', err);
      return false;
    }
  }

  // create sell order
  async sell(quantity, profit) {
    try {
      const symbol = this.symbol.meta;
      const { tickSize } = symbol; // minimum price difference you can trade by
      const { priceSigFig } = symbol;
      const { quantitySigFig } = symbol;
      const quantity = quantity.toFixed(quantitySigFig);
      const price = profit.toFixed(priceSigFig);

      const sellOrder = {
        orderId: randomString(40),
        symbol: this.config.tradingPair,
        side: 'SELL',
        quantity,
        price
      };
      this.queue.push(sellOrder);

      // Placing order
      this.logger.info('Place order: ');
      this.logger.info(`Symbol: ${this.config.tradingPair}`);
      this.logger.info('Side: SELL');
      this.logger.info(`Amount: ${quantity}`);
      this.logger.info(`Price: ${price}`);

      this.logger.success(`Selling...${sellOrder.symbol}`);
    } catch (err) {
      console.log('SELL ERROR: ', err.message);
      return false;
    }
  }

  compound(side, price) {
    if (!this.config.compound) return;
    if (side === 'BUY') this.state.netSpend -= price;
    if (side === 'SELL') this.state.netSpend += price;
    this.logger.success(`Compounding...${this.state.netSpend}`);
  }
};
