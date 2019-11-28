const Symbol = require('./Symbol.js');
const Ticker = require('./Ticker.js');
const Queue = require('./Queue.js');
const Logger = require('./Logger.js');

module.exports = class Bot {
  constructor(config) {
    this.config = config;
    this.symbol = null; // meta information about trading pair
    this.ticker = null; // bid/ask prices updated per tick
    this.queue = null; // queue for unfilled transactions
    this.watchlist = null; // orderId --> filledOrders map; as well as length
    this.logger = null; // terminal logging system

    this.init();
  }

  async init() {
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

    // setup logger
    this.logger = new Logger();

    this.hunt();
  }

  // execute bot
  hunt() {
    this.purchase();
  }

  // process the queue of open buy/sell orders
  async consume() {
    state.consuming = false;
  }

  // create buy order
  async purchase() {
    try {
      this.logger.success('Purchasing... ');
    } catch (err) {
      console.log('PURCHASE ERROR: ', err);
      return false;
    }
  }

  // create sell order
  async sell() {
    try {
      this.logger.success('Selling...');
    } catch (err) {
      console.log('SELL ERROR: ', err.message);
      return false;
    }
  }
};
