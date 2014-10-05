
/*
 * Copyright(c) qiri.com <yanxi@yanxi.com>
 */

var _ = require('underscore');
var util = require("util");

var QiriError = function() {
    this.name = 'QiriError';
    var self = this;
    _(arguments).each(function(arg) {
        if (arg.constructor === String) {
            self._msg = arg;
        } else if (arg.constructor === Number) {
            self._status = arg;
        }
    });
};

util.inherits(QiriError, Error);

QiriError.prototype.getMsg = function() {
    if (!this._msg) {
        switch(this._status) {
            case 403:
                this._msg = "没有权限";
                break;
            case 404:
                this._msg = "页面不存在";
                break;
            default:
                this._msg = "内部错误";
        }
    }
    return this._msg;
};

QiriError.prototype.getStatus = function() {
    return this._status || 500;
};

/*!
 * Module exports.
 */
module.exports = exports = QiriError;
