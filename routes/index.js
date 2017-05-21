var express = require('express');
var mongoose = require('mongoose');
var csrf=require('csurf');
var bcrypt=require('bcryptjs');
var Product=require('../models/product');
var User=require('../models/user')
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var router = express.Router();
//console.log("hi");
router.use(csrf());
//middleware which can be added on any page which requires authentication
/*function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('user/signin');
	}
};*/

passport.serializeUser(function (user, done) {
//  console.log("serializeUser user id is :",user.id);
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
//  console.log("deserializeUser user id is :",id);
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback:true
},function(req,email,password,done) {
    User.findOne({'email': email}, function (err, user) {
      //console.log(user);
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false,req.flash('message','Unknown user'));
        }
        bcrypt.compare(password,user.password,function(err, isMatch){
          if(err) throw err;
           if(!isMatch)
           return done(null,false,req.flash('message','Invalid password'));
         else
        return done(null, user);
    });
  });
}));

router.get('/',function (req,res,next) {
  //console.log(req.csrfToken());
  Product.find(function(err,docs) {
    if(err)
    console.log(err);
    else {
      //console.log(docs)
      var docsPartition = [];
      var partitionSize = 3;
      for (var i = 0; i < docs.length; i += partitionSize) {
          docsPartition.push(docs.slice(i, i+partitionSize));
      }
      res.render('shop/index',{title:'Shopping cart',products:docsPartition,message:req.flash('message')});
    }
  });
});

router.get('/user/signup',function (req,res) {
  //console.log(req.csrfToken());
  res.render('user/signup',{title:'Shopping cart',csrfToken:req.csrfToken(),message:req.flash('message')});
})

router.post('/user/signup',function (req,res) {
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(req.body.password, salt, function(err, hash) {
      var user=new User({
        firstName:req.body.firstName,
        lastName:req.body.lastName,
        email:req.body.email,
        password:hash
      });
      user.save(function (err) {
        if (err) {
          // req.flash('error','Something bad happened! Please try again.');
          if (err.code === 11000) {
            req.flash('message','That email is already taken, please try another.');
          }
        //  console.log(req.flash('error'));
          res.redirect('/user/signup');
          }
        else {
          req.flash('message','Registered Successfully');
          res.redirect('/');
        }
      })
    });
});
});
router.get('/user/profile',function(req,res){
  res.render('user/profile',{title:'Shopping cart'});
})
router.get('/user/signin',function(req,res){
res.render('user/signin',{title:'Shopping cart',csrfToken:req.csrfToken(),message: req.flash('message')});
})
router.post('/user/signin',
passport.authenticate('local', {successRedirect:'/user/profile',failureFlash: true ,failureRedirect:'/user/signin'}),
function(req, res) {
  res.redirect('/');
});
module.exports=router;
