var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');

var routes = require('../routes/route');
var middleware = require('../lib/middleware');
var config = require('../config');

var router = express.Router();
var langRouter = express.Router();

module.exports = exports = router;

router.use(middleware.fixSafariBug);

if (config.env === 'development') {
	router.use('/b', middleware.static('../browser'));
}

router.use('/s', middleware.static('s'));
router.use('/css', middleware.static('cc/css'));
router.use('/img', middleware.static('cc/img'));
router.use('/nocache', express.static(path.join(__dirname, '../public', 'nocache')));
router.get('/favicon.ico', express.static(path.join(__dirname, '../public')));

router.use(bodyParser.urlencoded({extended: false}));
router.use(bodyParser.json());
router.use(cookieParser(config.pwdSecret));

router.use(routes.account.loadUser);

router.use('/console', require('./console'));

router.get('/', routes.home);
router.get('/help/:page', routes.help);
router.use('/account/:page', routes.account);

router.use(middleware.notFound);
router.use(middleware.error);

