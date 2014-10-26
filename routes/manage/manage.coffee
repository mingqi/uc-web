async = require('async')

m = require('../../lib/models')
account = require '../../routes/account'
QiriError = require('../../lib/qiri-err')

module.exports = exports = (req, res, next) ->
  page = req.params.page;
  if !exports[page]
    return next(new QiriError(404))
  exports[page](req, res, next)

exports.checkRole = (req, res, next) ->
  visitor = req.visitor;
  if visitor?.isAdmin
    return next()

  error = '没有权限，请重新登录'
  if req.xhr
    return next(new QiriError(error))

  res.render 'account/login',
    email: null
    rd: req.originalUrl
    error: error

exports.ajax = require('./ajax')

exports.home = (req, res, next) ->
  res.render "manage/home",
    page: 'home'

exports.user = (req, res, next) ->
  res.render "manage/user",
    page: 'user'

exports.asUser = (req, res, next) ->
  account.setLoginCookie res,
    id: req.query.uid
    email: ''
  res.redirect '/console'
