var _ = require('underscore');
var express = require('express');
var http = require('http');
var path = require('path');
var ejs = require('ejs');

require("date-format-lite");

var config = require('./config');
var middleware = require('./middlewares/middleware');
var router = require('./routers/index');
var routes = require('./routes/route');

var app = express();

ejs.open = '{%';
ejs.close = '%}';

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(middleware.logger());
app.use(router);

app.locals = {
    _ : _,
    headTitle : "",
    page : '',
    error : null
};

var server = http.createServer(app);
server.setMaxListeners(100);
server.listen(config.port, function() {
    console.log(config.env + ': server listening on port ' + config.port);
});
