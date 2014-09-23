var _ = require('underscore');
var path = require('path');

var stageConfig = {
    development : {
        //mongodb: "mongodb://182.92.3.45/monitorat?poolSize=10&bufferMaxEntries=0",
        mongodb: "mongodb://127.0.0.1/metricsat?poolSize=10&bufferMaxEntries=0",
        domain: 'metricsat.qiri.com'
    },
    production : {
        port: 5002
    },
};

var config = {
    domain: 'uclogs.com',
    mongodb : "mongodb://mongo-01.uclogs.com/metricsat?poolSize=10&bufferMaxEntries=0",
    port : 5001,
    pwdSecret : "12NtRoQfVjhuDaIue1kxKtTNYq3",
    sendMail : {
        from : "MetricsAt <service@uclogs.com>",
        smtp: {
          host : "smtp.uclogs.com",
          secureConnection : false,
          port: 25
        }
    },
};

var env = process.env.NODE_ENV || 'development';

module.exports = exports = _.extend(config, stageConfig[env]);

exports.env = env;
