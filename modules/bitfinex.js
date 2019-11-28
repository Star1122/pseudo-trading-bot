const BFX = require('bitfinex-api-node');

const bitfinex = new BFX({
  apiKey: process.env.BITFINEX_API_KEY,
  apiSecret: process.env.BITFINEX_API_SECRET,

  ws: {
    autoReconnect: true,
    seqAudit: true,
    packetWDDelay: 10 * 1000
  }
});

const rest = bitfinex.rest(2, { transform: true });

module.exports = rest;
