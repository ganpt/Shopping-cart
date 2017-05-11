var express = require('express');
var mongoose = require('mongoose');
var csrf=require('csurf');
var bcrypt=require('bcryptjs');
var Product=require('../models/product');
var User=require('../models/user')
var router = express.Router();
//console.log("hi");
router.use(csrf());
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
      res.render('shop/index',{title:'Shopping cart',products:docsPartition});
    }
  });
});

router.get('/user/signup',function (req,res) {
  //console.log(req.csrfToken());
  res.render('user/signup',{title:'Shopping cart',csrfToken:req.csrfToken()});
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
          var error = 'Something bad happened! Please try again.';
          if (err.code === 11000) {
            error = 'That email is already taken, please try another.';
          }
          res.render('/user/signup', { error: error });
          }
        else {
          res.redirect('/');
        }

      })
    });
});
});

module.exports=router;
