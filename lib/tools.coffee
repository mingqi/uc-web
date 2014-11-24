_ = require 'underscore'
nodemailer = require 'nodemailer'
fs = require 'fs'
ejs = require 'ejs'

exports.render = (path, data) ->
  filePath = require('path').join __dirname, '../views', path + '.ejs'
  return null if !fs.existsSync(filePath)
  ejs.render fs.readFileSync(filePath, 'utf8'), data

exports.objectId = (timestamp) ->
  # timestamp: date
  hexSeconds = Math.floor(timestamp/1000).toString(16)
  new require('mongoose').Types.ObjectId(hexSeconds + "0000000000000000")
