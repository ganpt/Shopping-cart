var express=require('express');
var ejs=require('ejs');
var path=require('path');
var bodyParser=require('body-parser');
var session=require('express-session');
var expressLayouts = require('express-ejs-layouts');
var routes=require('./routes/index');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/ShoppingOwn');
var app=express();
//app.set('views', path.join(__dirname, 'views'));
app.use(session(
  {secret:'secretkey',resave: false,
   saveUninitialized: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('layout', 'layouts/layout');
app.use(expressLayouts);
app.use('/',routes);
app.listen(3000,function () {
  console.log("server listening at port 3000")
});
