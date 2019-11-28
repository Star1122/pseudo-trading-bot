const express = require('express');

const router = express.Router();

/**
 * GET api/status
 */
router.get('/status', (req, res) => res.send('OK'));

module.exports = router;
