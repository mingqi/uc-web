var _ = require('underscore');
var async = require('async');
var ObjectId = require('mongoose').Types.ObjectId;
var request = require('request');
var _s = require('underscore.string');

var QiriError = require('../../lib/qiri-err');
var m = require('../../model/models');

module.exports = exports = function(req, res, next) {
    var action = req.params.action;
    if (!exports[action]) {
        return next(new QiriError(404));
    }
    exports[action](req, res, next);
};

exports.search = function(req, res, next) {
    request.post({
        url: 'http://106.185.38.213:9200/demo/talog/_search',
        json: req.body
    }, function(error, response, body) {
        if (error) {
            return next(error);
        }
    }).pipe(res);
};

exports.getHosts = function(req, res, next) {
    var visitor = req.visitor;
    async.auto({
        hosts: function(callback) {
            m.Host.find({
                userId: visitor.id
            }, null, {
                sort: 'hostname'
            }, callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        var hosts = _.map(results.hosts, function(host) {
            return _.extend(host.toObject(), {
                isActive: host.lastPushDate && (new Date() - host.lastPushDate < 1000*60*5)
            });
        });
        res.json(hosts);
    });
};

exports.deleteFile = function(req, res, next) {
    var visitor = req.visitor;
    var hostId = req.body.hostId;
    var file = req.body.file;
    async.auto({
        host: function(callback) {
            m.Host.findOneAndUpdate({
                userId: visitor.id,
                _id: new ObjectId(hostId)
            }, {
                $pull: {
                    files : file
                }
            }, callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.host);
    });
};

exports.addFiles = function(req, res, next) {
    var visitor = req.visitor;
    var hostIds = req.body.hostIds;
    var newFiles = req.body.newFiles;

    async.map(hostIds, function(hostId, callback) {
        m.Host.findOneAndUpdate({
            userId: visitor.id,
            _id: new ObjectId(hostId)
        }, {
            $addToSet: {
                files : {
                    $each: _.chain(newFiles).map(function(file) {
                        return _s.trim(file);
                    }).filter(function(file) {
                        return !!file;
                    }).value()
                }
            }
        }, callback);
    }, function(err, hosts) {
        if (err) {
            return next(err);
        }
        res.json(hosts);
    });
};
