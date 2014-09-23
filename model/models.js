/*
 * Copyright(c) qiri.com <yanxi@yanxi.com>
 */

var _ = require('underscore');
var mongoose = require('mongoose');
var config = require('../config');

var Schema = mongoose.Schema;
var conn = mongoose.createConnection(config.mongodb, {
    server : {
        auto_reconnect : true
    }
});

conn.on('error', function(err) {
    console.log(err);
});

conn.on('open', function () { 
    console.log("connected to mongodb");
});

var schemas = {};

var metricPointSchema = {
    user_id : String,
    metric : String,
    aggregator : String,
    interval : String,
    point_time : Date,
    value : Number,
    dimensions: Schema.Types.Mixed  // [[name,value], ...]
};

var collections = {
    User : {
        email : String,         // uniq
        passwordMd5 : String,   // use md5 for security
        roles : [String],       // admin, pro
        licenseKey : String,    // [0-9a-zA-Z]{20}
    },
    Monitor : {
        userId : String,
        sid : String,
        name : String,
        description: String,
        type : String,
        hosts : [String],
        lastModified : Date,
        agentStatus : String,   // ok, fail
        agentMessage : String,
        config : Schema.Types.Mixed,
    },
    Host : {
        userId : String,
        hostname : String,
        version : String,
        lastPushDate : Date,
        serverInfo : Schema.Types.Mixed
    },
    NotificationService : {
        userId : String,
        type : String,  // email, pagerduty, ...
        title : String,
        serviceInfo : Schema.Types.Mixed,
    },
    AlertConfig : {
        userId : String,
        name : String,
        description : String,   // optional
        runbookUrl : String,    // optional
        enabled : Boolean,
        condition : {
            monitorId : String,
            metric : String,
            aggregator : String,
            conditionType : String, // above, below, stop
            threshold : Number,
            duration : Number,  // 分钟
        },
        notifications : [ String ],  // notificationServiceId
    },
    MonitorStatus: {
        collection: 'monitorStatuses',
        userId: String,
        monitorId: String,
        host: String,
        status: String,
        message: String,
        lastReportDate: Date,
    }
};

_(collections).each(function(schema, name) {
    var collectionName = schema.collection;
    delete schema.collection;
    schemas[name] = mongoose.Schema(collections[name], {
        strict : true,
        collection: collectionName
    });
});

_(['1m', '5m', '15m', '1h', '1d']).each(function(time) {
    schemas['MetricPoint' + time] = mongoose.Schema(metricPointSchema, {
        strict : true,
        collection : 'metric_point_' + time
    });
});

schemas.User.virtual('isAdmin').get(function() {
    return _.contains(this.roles, 'admin');
});

var models = (function() {
    var result = {};
    _(schemas).each(function(schema, name) {
        result[name] = conn.model(name, schema);
    });
    return result;
})();

module.exports = exports = models;
