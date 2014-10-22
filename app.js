var _ = require('underscore');
var express = require('express');
var http = require('http');
var path = require('path');
var ejs = require('ejs');
var compress = require('compression');

require("coffee-script/register");
require("date-format-lite");

var config = require('./config');
var middleware = require('./lib/middleware');
var router = require('./routers/index');
var routes = require('./routes/route');

var app = express();

ejs.open = '{%';
ejs.close = '%}';

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(middleware.logger());
app.use(compress());
app.use(router);

app.locals = {
    _ : _,
    headTitle : "",
    page : '',
    error : null,
    isDebug: config.env === 'development',
};

var server = http.createServer(app);
server.setMaxListeners(100);
server.listen(config.port, function() {
    console.log(config.env + ': server listening on port ' + config.port);
});
