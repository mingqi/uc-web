var _ = require('underscore');
var path = require('path');

var secretConfig = require('./secret-config');

var stageConfig = {
    development : {
        mongodb: "mongodb://127.0.0.1/uclogs?poolSize=10&bufferMaxEntries=0",
        domain: 'dev.uclogs.com',
        port : 5001,
        es: {
            hosts: ['es-dev-1:9200', 'es-dev-2:9200'],
            log: [{
              type: 'stdio',
              levels: ['error', 'warning']
            }],
            // log: 'trace',
        },
        logDir: path.join(process.cwd(), '/var/logs')
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
        },
        logDir: '/data/uc-web/logs'
    },
};

var config = {
    pwdSecret : secretConfig.pwdSecret,
    sendMail : {
        from : "UCLogs 云日志 <uclogs-support@uclogs.com>",
        smtp: {
            host: "smtp.exmail.qq.com",
            secure: true,
            port: 465,
            auth: {
                user : "uclogs-support@uclogs.com",
                pass : "uclogs2014supportw"
            }
        }
    },
    register: {
        needInviteCode: false
    },
    agentVersion: '1.0.2'
};

var env = process.env.NODE_ENV || 'development';

module.exports = exports = _.extend(config, stageConfig[env]);

exports.env = env;
