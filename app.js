var express = require('express');
var ejs = require('ejs');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var expressLayouts = require('express-ejs-layouts');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var expressValidator = require('express-validator');
var LocalStrategy = require('passport-local').Strategy;
var routes = require('./routes/index');
var userRoutes = require('./routes/user');

mongoose.connect('mongodb://localhost/ShoppingOwn');
var app = express();
//app.set('views', path.join(__dirname, 'views'));
app.use(session({
  secret: 'secretkey',
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 30 * 60
  }) //ttl in seconds
}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(expressValidator());
app.set('layout', 'layouts/layout');
app.use(expressLayouts);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
  //console.log(req.session);
  res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;
  next();
});
app.use('/user', userRoutes);
app.use('/', routes);
app.listen(3000, function() {
  console.log("server listening at port 3000")
});
