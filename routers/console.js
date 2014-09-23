var express = require('express');

var routes = require('../routes/route');
var middleware = require('../middlewares/middleware');

var router = express.Router();

router.use(routes.forceLogin);

router.get('/', routes.console.search);
router.use('/ajax/:action', routes.console.ajax);
router.get('/:page', routes.console);

module.exports = exports = router;
