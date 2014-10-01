var _ = require('underscore');
var async = require('async');
var ObjectId = require('mongoose').Types.ObjectId;
var request = require('request');

var QiriError = require('../../lib/qiri-err');
var m = require('../../model/models');

module.exports = exports = function(req, res, next) {
    var action = req.params.action;
    if (!exports[action]) {
        return next(new QiriError(404));
    }
    exports[action](req, res, next);
};

// monitor: document
var getMonitorWithStatus = function(monitor, callback) {
    m.MonitorStatus.find({
        userId: monitor.userId,
        monitorSid: monitor.sid
    }, function(err, statuses) {
        if (err) {
            return callback(err);
        }
        var statusIndexByHost = _.indexBy(statuses, 'host');
        var problems = [];
        _.each(monitor.hosts, function(host) {
            var status = statusIndexByHost[host];
            if (!status) {
                problems.push({
                    host: host,
                    message: 'Agent is not ready for this host',
                    lastReportDate: new Date()
                })
            } else if (status.status === 'problem') {
                problems.push(status);
            } else if (new Date() - status.lastReportDate > 1000*60*5) {
                problems.push({
                    host: host,
                    message: 'Agent is not running collectly',
                    lastReportDate: new Date()
                })
            }
        });
        var monitorObj = _.extend(monitor.toObject(), {
            status: problems.length ? 'problem' : 'ok',
            problems: problems
        });
        callback(null, monitorObj);
    });
};

exports.getMonitor = function(req, res, next) {
    var visitor = req.visitor;
    var id = req.query.id;
    async.auto({
        monitor : function(callback) {
            m.Monitor.findById(id, callback);
        }
    }, function(err, results) {
       if (err) {
           return next(err);
       }
       var monitor = results.monitor;
       if (!monitor || monitor.userId != visitor.id) {
           return next(new QiriError(403));
       }
       res.json(monitor);
    });
};

exports.getMonitors = function(req, res, next) {
    var visitor = req.visitor;
    async.auto({
        monitors : function(callback) {
            m.Monitor.find({
                userId : visitor.id
            }, null, {
                sort: 'name'
            }, callback);
        },
        monitorObjs : ['monitors', function(callback, results) {
            var monitors = results.monitors;
            async.map(monitors, getMonitorWithStatus, callback);
        }]
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.monitorObjs);
    });
};

exports.upsertMonitor = function(req, res, next) {
    var visitor = req.visitor;
    var monitor = _.extend(req.body.monitor, {
        lastModified: new Date()
    });

    async.auto({
        existingMonitor: function(callback) {
            m.Monitor.findOne({
                userId: visitor.id,
                name: monitor.name
            }, callback);
        },
        monitor : ['existingMonitor', function(callback, results) {
            var existingMonitor = results.existingMonitor;
            if (existingMonitor && existingMonitor.id != monitor._id) {
                return callback(new QiriError('The monitor name exists, please change it.'));
            }
            if (monitor._id) {
                var monitorId = monitor._id;
                delete monitor._id;
                m.Monitor.findOneAndUpdate({
                    _id : new ObjectId(monitorId),
                    userId : visitor.id
                }, monitor, callback);
            } else {
                m.Monitor.create(_.extend(monitor, {
                    userId : visitor.id,
                    sid : require("generate-key").generateKey(10)
                }), callback);
            }
        }],
        monitorObject : ['monitor', function(callback, results) {
            var monitor = results.monitor;
            getMonitorWithStatus(monitor, callback);
        }]
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.monitorObject);
    });
};

exports.deleteMonitor = function(req, res, next) {
    var visitor = req.visitor;
    var monitorId = req.body.id;
    
    async.auto({
        remove : function(callback) {
            m.Monitor.findOneAndRemove({
                _id : new ObjectId(monitorId),
                userId : visitor.id
            }, callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json({});
    });
};

exports.getHosts = function(req, res, next) {
    var visitor = req.visitor;
    async.auto({
        hosts : function(callback) {
            m.Host.find({
                userId : visitor.id,
                lastPushDate: {
                    $gt: new Date(new Date() - 1000*3600*24*7)
                }
            }, null, {
                sort: 'hostname'
            }, callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json(_.map(results.hosts, function(host) {
            return {
                hostname: host.hostname,
                isActive: new Date() - host.lastPushDate < 1000*60*5
            };
        }));
    });
};

exports.getMetric = function(req, res, next) {
    var visitor = req.visitor;
    var metric = req.body.metric;
    var aggregators = req.body.aggregators;
    var begin = new Date(req.body.begin);
    var end = new Date(req.body.end);
    var dimensions = req.body.dimensions;
    var intervalPostfix = (function() {
        var interval = "1d";
        var minutes = (end - begin) / (1000 * 60);
        if (minutes <= 60 * 3) {
            interval = "1m"
        } else if (minutes <= 60 * 15) {
            interval = "5m";
        } else if (minutes <= 60 * 45) {
            interval = "15m";
        } else if (minutes <= 60 * 28 * 24) {
            // 28 days
            interval = "1h";
        }
        return interval;
    })();
    var intervalMs = (function() {
        var map = {
            "1d": 1000 * 3600 * 24,
            "1h": 1000 * 3600,
            "1m": 1000 * 60,
            "5m": 1000 * 60 * 5,
            "15m": 1000 * 60 * 15
        };
        return map[intervalPostfix];
    })();
    
    async.auto({
        metricPoints : function(callback) {
            
            var module = 'MetricPoint' + intervalPostfix;
            if (!m[module]) {
                return callback(new QiriError('interval is illegal'));
            }
            var conditions = {
                user_id: visitor.id,
                dimensions : dimensions,
                metric : metric,
                aggregator: {
                    $in: aggregators
                },
                $and : [{
                    point_time : {
                        $gte : begin,
                    }
                }, {
                    point_time : {
                        $lt : end
                    }
                }]
            };
            m[module].find(conditions, callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        var groups = _.groupBy(results.metricPoints, "aggregator");
        var series = _.map(groups, function(points, aggregator) {
            var pointMap = _.indexBy(points, function(point) {
                return point.point_time.getTime();
            });
            var data = [];
            for (var date = begin - (begin % intervalMs); date <= end; date += intervalMs) {
                data.push([date, pointMap[date] && pointMap[date].value]);
            }
            return {
                name: aggregator,
                data: data
            };
        });
        res.json(series);
    });
};

exports.getAlertConfigs = function(req, res, next) {
    var visitor = req.visitor;
    async.auto({
        alerts : function(callback) {
            m.AlertConfig.find({
                userId : visitor.id
            }, null, {
                sort: 'name'
            }, callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.alerts);
    });
};

exports.upsertAlertConfig = function(req, res, next) {
    var visitor = req.visitor;
    var alertConfig = req.body.alertConfig;
    
    async.auto({
        alertConfig : function(callback) {
            if (alertConfig._id) {
                var alertConfigId = alertConfig._id;
                delete alertConfig._id;
                m.AlertConfig.findOneAndUpdate({
                    _id : new ObjectId(alertConfigId),
                    userId : visitor.id
                }, alertConfig, callback);
            } else {
                m.AlertConfig.create(_.extend(alertConfig, {
                    userId : visitor.id
                }), callback);
            }
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.alertConfig);
    });
};

exports.deleteAlertConfig = function(req, res, next) {
    var visitor = req.visitor;
    var alertConfigId = req.body.id;

    async.auto({
        remove : function(callback) {
            m.AlertConfig.findOneAndRemove({
                _id : new ObjectId(alertConfigId),
                userId : visitor.id
            }, callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json({});
    });
};

exports.upsertService = function(req, res) {
    var visitor = req.visitor;
    var serviceConfig = req.body.serviceConfig;
    
    async.auto({
        serviceConfig : function(callback) {
            if (serviceConfig._id) {
                var serviceConfigId = serviceConfig._id;
                delete serviceConfig._id;
                m.NotificationService.findOneAndUpdate({
                    _id : new ObjectId(serviceConfigId),
                    userId : visitor.id
                }, serviceConfig, callback);
            } else {
                m.NotificationService.create(_.extend(serviceConfig, {
                    userId : visitor.id
                }), callback);
            }
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.serviceConfig);
    });
};

exports.getServices = function(req, res, next) {
    var visitor = req.visitor;
    async.auto({
        services : function(callback) {
            m.NotificationService.find({
                userId : visitor.id
            }, callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.services);
    });
};

exports.deleteService = function(req, res, next) {
    var visitor = req.visitor;
    var notificationServiceId = req.body.id;

    async.auto({
        remove : function(callback) {
            m.NotificationService.findOneAndRemove({
                _id : new ObjectId(notificationServiceId),
                userId : visitor.id
            }, callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json({});
    });
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
            }, callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.json(results.hosts);
    });
};
