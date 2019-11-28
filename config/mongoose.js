const mongoose = require('mongoose');
const chalk = require('chalk');

const { mongo /* , env */ } = require('./vars');

// Set mongoose Promise to Bluebird
mongoose.Promise = Promise;

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

// Exit application on error
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

// Print mongoose logs in dev env
// if (env === 'development') {
//   mongoose.set('debug', true);
// }

/**
 * Connect to mongo db
 *
 * @returns {object} Mongoose connection
 * @public
 */
exports.connect = () => {
  mongoose.connect(mongo.uri, {
    keepAlive: 1,
  });

  return mongoose.connection;
};
