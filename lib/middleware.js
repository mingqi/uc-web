var express = require('express');
var fs = require('fs');
var path = require('path');
var morgan  = require('morgan');
var mkdirp = require('mkdirp');

var QiriError = require('../lib/qiri-err');
var config = require('../config');

var handleQiriError = function(err, req, res, next) {
    if (err.constructor !== QiriError) {
        return next(err);
    }
    // QiriError
    res.status(err.getStatus());
    if (req.xhr) {
        res.send({ error: err.getMsg() });
    } else {
        res.render('message', { message: err.getMsg(), visitor: req.visitor });
    }
};

exports.logger = function() {
    var logDir = config.logDir;

    if (!fs.existsSync(logDir)) {
        mkdirp.sync(logDir);
    }

    var accessLogfile = fs.createWriteStream(path.join(logDir, 'access.log'), {
        flags : 'a'
    });

    // https://github.com/expressjs/morgan
    return morgan('combined', {
        stream : accessLogfile,
    });
};

exports.error = function(err, req, res, next) {
    handleQiriError(err, req, res, function(err) {
        console.error(err.stack);
        res.status(500);
        if (req.xhr) {
            res.send({
                error : "Server Error"
            });
        } else {
            res.render('message', {
                message : "服务器错误",
                visitor : req.visitor
            });
        }
    });
};

exports.notFound = function(req, res, next) {
    next(new QiriError(404));
};

exports.allowCrossDomain = function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    next();
};

exports.fixSafariBug = function(req, res, next) {
    var ua = req.header('user-agent');
    if (ua && ua.match(/safari/i)) {
        req.headers['if-none-match'] = undefined;
    }
    next();
};

exports.static = function(dir) {
    return express.static(path.join(__dirname, '../public', dir), {
        maxAge : 1000 * 3600 * 24 * 30
    });
};
