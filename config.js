var _ = require('underscore');
var path = require('path');

var stageConfig = {
    development : {
        //mongodb: "mongodb://182.92.3.45/monitorat?poolSize=10&bufferMaxEntries=0",
        mongodb: "mongodb://127.0.0.1/uclogs?poolSize=10&bufferMaxEntries=0",
        domain: 'dev.uclogs.com',
        port : 5001,
        es: {
            hosts: ['es-dev-1.uclogs.com:9200'],
            log: 'trace'
        }
    },
    production : {
        mongodb : "mongodb://es1/uclogs?poolSize=10&bufferMaxEntries=0",
        domain: 'www.uclogs.com',
        port: 5002,
        es: {
            hosts: ['es1:9200', 'es2:9200', 'es3:9200'],
            log: [{
              type: 'stdio',
              levels: ['error', 'warning']
            }]
        }
    },
};

var config = {
    pwdSecret : "12NtRoQfVjhuDaIue1kxKtTNYq3",
    sendMail : {
        from : "UCLogs <service@uclogs.com>",
        smtp: {
          host : "es2",
          secureConnection : false,
          port: 25
        }
    },
    register: {
        needInviteCode: true
    }
};

var env = process.env.NODE_ENV || 'development';

module.exports = exports = _.extend(config, stageConfig[env]);

exports.env = env;
