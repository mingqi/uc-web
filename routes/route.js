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
    res.render('help/' + req.params.page);
};

exports.forceLogin = function(req, res, next) {
    var visitor = req.visitor;
    if (visitor) {
        return next();
    }

    var error = "继续之前请先登录";
    if (req.xhr) {
        return next(new QiriError(error));
    }
    res.render('account/login', {
        email : null,
        rd : req.originalUrl,
        error : error,
    });
};
