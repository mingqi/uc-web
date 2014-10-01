var _ = require('underscore');
var path = require('path');

var stageConfig = {
    development : {
        //mongodb: "mongodb://182.92.3.45/monitorat?poolSize=10&bufferMaxEntries=0",
        mongodb: "mongodb://127.0.0.1/uclogs?poolSize=10&bufferMaxEntries=0",
        domain: 'dev.uclogs.com',
        port : 5001,
    },
    production : {
        mongodb : "mongodb://mongo-01.uclogs.com/uclogs?poolSize=10&bufferMaxEntries=0",
        domain: 'www.uclogs.com',
        port: 5002
    },
};

var config = {
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
