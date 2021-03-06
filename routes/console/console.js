var async = require('async');

var m = require('../../lib/models');
var config = require('../../config');
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
        page : 'config',
        agentVersion: config.agentVersion
    });
};

exports.search = function(req, res, next) {
    var visitor = req.visitor;

    m.Host.count({
        userId: visitor.id
    }, function(err, count) {
        if (err) {
            return next(err);
        }

        if (count === 0) {
            return res.redirect('/console/config');
        }

        res.render("console/search", {
            page: 'search'
        });
    });
};
