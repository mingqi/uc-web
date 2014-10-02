var async = require('async');

var m = require('../../lib/models');
var QiriError = require('../../lib/qiri-err');

module.exports = exports = function(req, res, next) {
    var page = req.params.page;
    if (!exports[page]) {
        return next(new QiriError(404));
    }
    exports[page](req, res, next);
};

exports.ajax = require('./ajax');

exports.config = function(req, res, next) {
    res.render("console/config", {
        page : 'config'
    });
};

exports.search = function(req, res, next) {
    res.render("console/search", {
        page: 'search'
    });
};
