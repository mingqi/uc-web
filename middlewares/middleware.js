var express = require('express');
var fs = require('fs');
var path = require('path');
var morgan  = require('morgan');

var QiriError = require('../lib/qiri-err');

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
    var accessLogfile = fs.createWriteStream(process.cwd() + '/var/logs/access.log', {
        flags : 'a'
    });
    // http://www.senchalabs.org/connect/middleware-logger.html
    return morgan(":date :method :url :status :res[content-length] - :response-time ms :user-agent", {
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
                message : "server_unknow_error",
                visitor : req.visitor
            });
        }
    });
};

exports.notFound = function(req, res, next) {
    if (req.path === '/') {
        var locale = req.signedCookies.lang || 'en';
        return res.redirect('/' + locale + '/');
    }
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
