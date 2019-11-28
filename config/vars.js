const path = require('path');

// Load environment variables from .env file
require('dotenv-safe').config({
  allowEmptyValues: true,
  path: path.join(__dirname, '../.env'),
  sample: path.join(__dirname, '../.env.example'),
});

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  mongo: {
    uri: process.env.MONGODB_URI,
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  api: {
    key: process.env.API_KEY,
    url: process.env.API_URL,
  },
};
