var _ = require('underscore');
var _s = require('underscore.string');
var async = require('async');
var ObjectId = require('mongoose').Types.ObjectId;
var elasticsearch = require('elasticsearch');
var moment = require('moment');

var QiriError = require('../../lib/qiri-err');
var config = require('../../config');
var m = require('../../lib/models');
var logger = require('../../lib/logger')(__filename);

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
    var type = req.body.type || 'event';
    var keywords = req.body.keywords;

    logger.info("search type:" + type + " keywords:" + (keywords || '无'));

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

    console.log(JSON.stringify(esBody,null,4))
    esClient.search({
        index: index.join(','),
        type: type,
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
                userId: visitor.id,
                lastPushDate: {
                    $gt: new Date(new Date() - 1000*3600*24*2)
                }
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
                isActive: host.isActive
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

        var host = results.host;
        res.json(_.extend(host.toObject(), {
            isActive: host.isActive
        }));
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
        hosts = _.map(hosts, function(host) {
            return _.extend(host.toObject(), {
                isActive: host.isActive
            });
        });
        res.json(hosts);
    });
};
