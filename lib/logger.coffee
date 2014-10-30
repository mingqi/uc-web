log4js = require 'log4js'
path = require 'path'

config = require('../config')

logConfig =
  appenders: []

if config.env == 'production'
  logConfig.appenders.push
    type: "file"
    filename: path.join(config.logDir, "app.log")
    maxLogSize: 1024*1024*5
    backups: 10

if config.env == 'development'
  logConfig.appenders.push
    type: 'console'

log4js.configure logConfig

module.exports = exports = (name) ->
  if name?.indexOf(process.cwd()) == 0
    name = name.substr(process.cwd().length)
  log4js.getLogger name
