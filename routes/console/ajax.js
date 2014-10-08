var _ = require('underscore');
var _s = require('underscore.string');
var async = require('async');
var ObjectId = require('mongoose').Types.ObjectId;
var elasticsearch = require('elasticsearch');
var moment = require('moment');

var QiriError = require('../../lib/qiri-err');
var config = require('../../config');
var m = require('../../lib/models');

var esClient = new elasticsearch.Client({
  hosts: config.es.hosts,
  log: config.es.log,
});

module.exports = exports = function(req, res, next) {
    var action = req.params.action;
    if (!exports[action]) {
        return next(new QiriError(404));
    }
    exports[action](req, res, next);
};

exports.search = function(req, res, next) {
    var visitor = req.visitor;
    var begin = moment(req.body.begin).zone("+08:00").startOf('day');
    var end = moment(req.body.end).zone("+08:00");
    var esBody = req.body.esBody;

    var filters = esBody.query.filtered.filter.and;
    filters.push({
        term: {
            userId: visitor.id
        }
    });

    var index = [];
    while (begin.isBefore(end)) {
        index.push('uclogs-' + begin.format('YYYYMMDD'));
        begin = begin.add(1, 'day');
    }

    esClient.search({
        index: index.join(','),
        ignoreUnavailable: true,
        body: esBody
    }, function(error, response) {
        if (error) {
            return next(error);
        }
        return res.json(response);
    });
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
