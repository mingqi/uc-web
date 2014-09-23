var async = require('async');

var m = require('../../model/models');
var QiriError = require('../../lib/qiri-err');

module.exports = exports = function(req, res, next) {
    var page = req.params.page;
    if (!exports[page]) {
        return next(new QiriError(404));
    }
    exports[page](req, res, next);
};

exports.ajax = require('./ajax');

exports.overview = function(req, res, next) {
    res.render("console/overview", {
        page : 'overview'
    });
};

exports.metrics = function(req, res, next) {
    res.render("console/metrics", {
        page : 'metrics'
    });
};

exports.metric = function(req, res, next) {
    var visitor = req.visitor;
    var monitorId = req.query.monitorId;
    res.render("console/metric", {
        page : 'metrics',
        monitorId: monitorId
    });
};

exports.alert = function(req, res, next) {
    res.render("console/alert", {
        page : 'alert'
    });
};

exports.notification = function(req, res, next) {
    res.render("console/notification", {
        page : 'notification'
    });
};

exports.search = function(req, res, next) {
    res.render("console/search")
};

exports.demo = function(req, res, next) {
    console.log(000)
    res.render("console/demo");
};
