/*
 * Copyright(c) qiri.com <yanxi@yanxi.com>
 */

var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var path = require('path');
var _s = require('underscore.string');
var nodemailer = require("nodemailer");
var querystring = require("querystring");
var rand = require("random-key");

var config = require('../config');
var m = require('../lib/models');
var QiriError = require('../lib/qiri-err');
var utils = require('../lib/utils');

var getPwdMd5 = function(password) {
    var pwd = password + config.secret; 
    return crypto.createHash('md5').update(pwd).digest('hex');
};

var setLoginCookie = function(res, user) {
    var opt = {
        maxAge : 30 * 24 * 3600 * 1000,
        signed : true,
    };
    res.cookie('maUid', user.id, opt);
    res.cookie('userEmail', user.email, opt);
};

var validateResetPwdKey = function(params) {
    if (params.key !== getPwdMd5(params.date + params.email)) {
        return false;
    }
    if (new Date() - parseFloat(params.date) > 1000 * 3600 * 24 * 2) {
        // 2 天过期
        return false;
    }
    return true;
};

module.exports = exports = function(req, res, next) {
    var page = req.params.page;
    if (!exports[page]) {
        return next(new QiriError(404));
    }
    exports[page](req, res, next);
};

exports.login = function(req, res, next) {
    if (req.xhr) {
        return res.render('account/ajax-login', {
            callback : req.query.callback,
            email : req.signedCookies.userEmail,
        });
    }
    res.render('account/login', {
        email : req.signedCookies.userEmail,
        rd : req.query.rd || '/console/',
        error : req.query.error,
    });
};

exports.logout = function(req, res, next) {
    res.clearCookie('maUid');
    return res.redirect("/");
};

exports.postLogin = function(req, res, next) {
    var rd = req.body.rd || "/";
    var email = (req.param('email') || "").toLowerCase();
    var password = req.param('password') || "";

    async.auto({
        existUser : function(callback) {
            m.User.findOne({
                email : email,
                passwordMd5 : getPwdMd5(password)
            }, callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (results.existUser) {
            setLoginCookie(res, results.existUser);
            return req.xhr ? res.json({}) : res.redirect(rd);
        } else {
            var error = 'Email 或者密码错误';
            if (req.xhr) {
                return res.json({
                    error : error
                });
            }
            res.render('account/login', {
                email : email,
                rd : rd,
                error : error
            });
        }
    });
};

exports.register = function(req, res, next) {
    res.render('account/register', {
        user : null,
        rd : req.query.rd || '/console/',
        inviteCode: req.query.inviteCode || '',
        needInviteCode: config.register.needInviteCode
    });
};

exports.postRegister = function(req, res, next) {
    var rd = req.body.rd || "/";
    var inviteCode = (req.body.inviteCode || '').toUpperCase();
    var user = {
        email : (_s.trim(req.body.email) || "").toLowerCase(),
        password : _s.trim(req.body.password) || "",
    };
    var password2 = req.body.password2;

    var renderError = function(error) {
        if (req.xhr) {
            return res.json({
                error : error
            });
        }
        res.render('account/register', {
            user : user,
            rd : rd,
            error : error,
            inviteCode: inviteCode,
            needInviteCode: config.register.needInviteCode
        });
    };

    if (!user.email.match(/^[\w\.-]+@[\w\.-]+\.[a-z]{2,4}$/)) {
        return renderError('邮箱地址不符合规则');
    }
    if (user.password.length < 6) {
        return renderError('密码长度不能小于6');
    }
    if (user.password != password2) {
        return renderError('两次输入密码不一致');
    }
    async.auto({
        existUser : function(callback) {
            m.User.findOne({
                email : user.email
            }, callback);
        },
        inviteCode: function(callback) {
            if (!config.register.needInviteCode) {
                return callback(null);
            }
            m.InviteCode.findOne({
                code: inviteCode,
                goal: 'register',
                userId: {
                    $exists: false
                }
            }, function(err, inviteCode) {
                if (err) {
                    return callback(err);
                }
                if (!inviteCode) {
                    return callback(new QiriError('验证码无效，或者已经使用过'));
                }
                callback(null, inviteCode);
            });
        },
        newUser : ['existUser', 'inviteCode', function(callback, results) {
            if (results.existUser) {
                return callback(new QiriError('Email 已经注册过，请更换'));
            }
            m.User.create({
                email: user.email,
                passwordMd5: getPwdMd5(user.password),
                licenseKey : rand.generate(20),
            }, callback);
        }],
        updateInviteCode: ['newUser', function(callback, results) {
            if (!results.inviteCode) {
                return callback(null);
            }
            m.InviteCode.update({
                code: inviteCode
            }, {
                userId: results.newUser.id
            }, callback);
        }]
    }, function(err, results) {
        if (err) {
            return renderError(err.getMsg());
        }

        setLoginCookie(res, results.newUser);
        if (req.xhr) {
            res.json({});
        } else {
            res.redirect(rd);
        }
    });
};

exports.findPwd = function(req, res, next) {
    res.render('account/find-pwd');
};

exports.postFindPwd = function(req, res, next) {
    var email = (req.body.email || '').toLowerCase();

    var getUrl = function() {
        var date = new Date() * 1;
        var key = getPwdMd5(date + email);
        var query = querystring.stringify({
            date : date,
            email : email,
            key : key
        });
        return 'http://' + config.domain + '/account/resetPwd?' + query;
    };

    async.auto({
        existUser : function(callback) {
            m.User.findOne({
                email : email
            }, callback);
        },
        sendMail : [ 'existUser', function(callback, results) {
            if (!results.existUser) {
                return callback();
            }
            callback(null);
            var url = getUrl();
            utils.sendMail({
                to : email,
                subject : '重置你的密码',
                html : '请点击下面链接重置你的密码: <a href="' + url + '">' + url + '</a>，两日内有效。',
            }, function(err, response) {
                if (err) {
                    console.error(err);
                }
            });
        }]
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (!results.existUser) {
            return res.render('message', {
                message : 'Email 邮箱没有注册过'
            });
        } else {
            return res.render('message', {
                message : '请检查你的邮箱来重置密码'
            });
        }
    });
};

exports.resetPwd = function(req, res, next) {
    if (!validateResetPwdKey(req.query)) {
        return res.render('message', {
            message : '链接无效或者已过期'
        });
    }

    res.render('account/reset-pwd', {
        query : req.query
    });
};

exports.postResetPwd = function(req, res, next) {
    if (!validateResetPwdKey(req.body)) {
        return res.render('message', {
            message : '链接无效或者已过期'
        });
    }

    var email = req.body.email;
    var password = req.body.password;

    if (password.length < 6) {
        return res.render('message', {
            message : '密码长度不能小于6'
        });
    }

    async.auto({
        resetPwd : function(callback) {
            m.User.findOneAndUpdate({
                email : email
            }, {
                $set : {
                    passwordMd5 : getPwdMd5(password)
                }
            }, callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        return res.render('message', {
            message : '密码修改成功'
        });
    });
};

exports.loadUser = function(req, res, next) {
    var userId = req.signedCookies.maUid;
    async.auto({
        user : function(callback) {
            m.User.findById(userId, callback);
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        res.locals.visitor = req.visitor = results.user;
        next();
    });
};
