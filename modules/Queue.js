module.exports = class Queue {
  constructor(config) {
    this.tradingPair = config.tradingPair;
  }

  init() {
    this.meta = Object.assign(this.getters(), this.meta);
  }

  push(txn) {
    try {
      this.meta.queue[txn.orderId] = txn;
      return true;
    } catch (err) {
      console.log('QUEUE ERROR: ', err);
      return false;
    }
  }

  getters() {
    return {
      get length() {
        return Object.keys(this.queue).length;
      },
      get orders() {
        return this.queue;
      }
    };
  }
};
