var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');

exports.account = require('./account');
exports.console = require('./console/console');

exports.home = function(req, res, next) {
    res.render("home");
};

exports.help = function(req, res, next) {
    var page = req.params.page;
    var localeView = 'help/' + page + '-' + req.i18n.locale;
    if (fs.existsSync(path.join(__dirname, '../views', localeView + '.ejs'))) {
        return res.render(localeView);
    }
    res.render('help/' + req.params.page);
};

exports.forceLogin = function(req, res, next) {
    var visitor = req.visitor;
    if (visitor) {
        return next();
    }

    var error = "sign_in_before_continue";
    if (req.xhr) {
        return next(new QiriError(error));
    }
    res.render('account/login', {
        email : null,
        rd : req.originalUrl,
        error : error,
    });
};
