var _ = require('underscore');

/**
 * @api private
 * @inherits Error https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error
 * new QiriError([msg], [status])
 */
function QiriError() {
    this.name = 'QiriError';
    var self = this;
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    _(arguments).each(function(arg) {
        if (arg.constructor === String) {
            self._msg = arg;
        } else if (arg.constructor === Number) {
            self._status = arg;
        }
    });
}

/*!
 * Inherits from Error.
 */
QiriError.prototype.__proto__ = Error.prototype;

QiriError.prototype.getMsg = function() {
    if (!this._msg) {
        switch(this._status) {
            case 403:
                this._msg = "Forbidden";
                break;
            case 404:
                this._msg = "页面不存在";
                break;
            default:
                this._msg = "服务器错误";
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