const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const expressValidator = require('express-validator');
const errorHandler = require('errorhandler');

const routes = require('../routes');
const { env, port, logs } = require('./vars');

/**
 * Express instance
 * @public
 */
const app = express();

// set port
app.set('port', port);

// enable proxy
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// apply to all requests
app.use(limiter);

// request logging. dev: console | production: file
app.use(morgan(logs));

// parse body params and attache them to req.body
const rawBodySaver = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};
app.use(bodyParser.json({ verify: rawBodySaver }));
app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
app.use(bodyParser.raw({ verify: rawBodySaver, type: '*/*' }));

app.use(expressValidator());

// gzip compression
app.use(compress());

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

app.disable('x-powered-by');

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// mount api /api routes
app.use('/api', routes);

/**
 * Error Handler.
 */
if (env === 'development') {
  // only use in development
  app.use(errorHandler());
} else {
  app.use((err, req, res) => {
    console.error(err);
    res.status(500).send('Server Error');
  });
}

module.exports = app;
