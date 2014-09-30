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

var collections = {
    User : {
        email : String,         // uniq
        passwordMd5 : String,   // use md5 for security
        roles : [String],       // admin, pro
        licenseKey : String,    // [0-9a-zA-Z]{20}
    },
    Host : {
        userId : String,
        hostname : String,
        version : String,
        lastPushDate : Date,
        serverInfo : Schema.Types.Mixed
    },
    LogConfig : {
        userId: String,
        config: [{
            hostId: String,
            files: [String]
        }]
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
