/*
 * Copyright(c) qiri.com <yanxi@yanxi.com>
 */

var _ = require('underscore');
var crypto = require('crypto');
var fs = require('fs');
var nodemailer = require('nodemailer');

var config = require('../config');

exports.md5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
};

exports.sortById = function(objects, ids) {
    var idIndexMap = {};
    _(ids || []).each(function(id, index) {
        idIndexMap[id] = index;
    });
    return _(objects).sortBy(function(object) {
        return idIndexMap[object.id];
    });
};

exports.sendMail = function(option, callback) {
    var smtpTransport = nodemailer.createTransport(config.sendMail.smtp);
    var mailOptions = {
        from : config.sendMail.from,
        to : option.to || config.sendMail.to,
        subject : option.subject,
        text : option.text,
        html : option.html,
    };
    smtpTransport.sendMail(mailOptions, function(error, response) {
        smtpTransport.close();
        if (callback) {
            callback(error, response);
        }
    });
};

exports.move = function(source, des, callback) {
    // fs.rename can not move a file from one partition to another
    var is = fs.createReadStream(source);
    var os = fs.createWriteStream(des);

    is.pipe(os);
    is.on('end', function() {
        fs.unlinkSync(source);
        callback();
    });
};
