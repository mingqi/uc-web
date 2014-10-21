_ = require('underscore')
async = require('async')
ObjectId = require('mongoose').Types.ObjectId
rand = require('random-key')

QiriError = require('../../lib/qiri-err')
m = require('../../lib/models')

module.exports = exports = (req, res, next) ->
  {action} = req.params;
  if !exports[action]
    return next(new QiriError(404))
  exports[action](req, res, next)

exports.getUsers = (req, res, next) ->
  m.User.find {}, (err, users) ->
    return next() if err
    res.json(users)

exports.getInviteCodes = (req, res, next) ->
  m.InviteCode.find {}, null, {sort: '_id'}, (err, codes) ->
    return next() if err
    res.json(codes)

exports.createInviteCodes = (req, res, next) ->
  {goal, num} = req.body

  async.map [1..num], (i, callback) ->
    m.InviteCode.create
      goal: goal
      code: rand.generateBase30(5)
    , callback
  , (err, results) ->
    return next(err) if err
    res.json(results)
