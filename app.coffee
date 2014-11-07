_ = require("underscore")
express = require("express")
http = require("http")
path = require("path")
ejs = require("ejs")
compress = require("compression")
require "date-format-lite"

logger = require("./lib/logger") __filename
config = require("./config")
middleware = require("./lib/middleware")
router = require("./routers/index")
routes = require("./routes/route")

app = express()
ejs.open = "{%"
ejs.close = "%}"

app.set "views", __dirname + "/views"
app.set "view engine", "ejs"
app.use middleware.logger()
app.use compress()
app.use router

app.locals =
  _: _
  headTitle: ""
  page: ""
  error: null
  isDebug: config.env is "development"

server = http.createServer(app)
server.setMaxListeners 100
server.listen config.port, ->
  console.log config.env + ": server listening on port " + config.port

process.on 'uncaughtException', (err) ->
  logger.error(err)
