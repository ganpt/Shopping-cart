var express = require('express');
var csrf = require('csurf');
var bcrypt = require('bcryptjs');
var User = require('../models/user')
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Order = require('../models/order');
var router = express.Router();
//console.log("hi");
router.use(csrf());

function noAuthenticationRequired(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');
  }
};
//middleware which can be added on any page which requires authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {;
    res.redirect('/user/signin');
  }
};

router.get('/profile', ensureAuthenticated, function(req, res) {
  Order.find({
    user: req.user
  }, function(err, orders) {
    if (err) {
      return res.write('Error!');
    }
    res.render('user/profile', {
      orders: orders,
      title: 'Shopping cart'
    });
  });
});

router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
})

// both /profile and /logout routes are placed above  noAuthenticationRequired  because both of them requires authentication
router.use('/', noAuthenticationRequired, function(req, res, next) {
  next();
})
passport.serializeUser(function(user, done) {
  //  console.log("serializeUser user id is :",user.id);
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  //  console.log("deserializeUser user id is :",id);
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, function(req, email, password, done) {
  User.findOne({
    'email': email
  }, function(err, user) {
    //console.log(user);
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, req.flash('message', 'Unknown user'));
    }
    bcrypt.compare(password, user.password, function(err, isMatch) {
      if (err) throw err;
      if (!isMatch)
        return done(null, false, req.flash('message', 'Invalid password'));
      else
        return done(null, user);
    });
  });
}));

router.get('/signup', function(req, res) {
  //console.log(req.csrfToken());
  res.render('user/signup', {
    title: 'Shopping cart',
    csrfToken: req.csrfToken(),
    messages: req.flash('message')
  });
})

router.post('/signup', function(req, res) {
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var password = req.body.password;
  //validation using express-validator
  req.checkBody('firstName', ' First Name is required ').notEmpty();
  req.checkBody('lastName', ' Last Name is required ').notEmpty();
  req.checkBody('email', ' E-Mail is required ').notEmpty();
  req.checkBody('email', ' E-Mail is Invalid ').isEmail();
  req.checkBody('password', ' Password is required ').notEmpty();

  req.getValidationResult().then(function(result) {
    if (!result.isEmpty()) {
      var errors = result.useFirstErrorOnly().array();
      var messages = [];
      errors.forEach(function(error) {
        messages.push(error.msg);
      });
      req.flash('message', messages);
      res.render('user/signup', {
        title: 'Shopping cart',
        csrfToken: req.csrfToken(),
        messages: req.flash('message')
      });
    } else {
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
          var user = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hash
          });
          user.save(function(err) {
            if (err) {
              // req.flash('error','Something bad happened! Please try again.');
              if (err.code === 11000) {
                req.flash('message', 'That email is already taken, please try another.');
              }
              //  console.log(req.flash('error'));
              res.render('user/signup', {
                title: 'Shopping cart',
                csrfToken: req.csrfToken(),
                messages: req.flash('message')
              });
            } else {
              if (req.session.oldUrl) {
                var oldUrl = req.session.oldUrl;
                req.session.oldUrl = null;
                res.redirect(oldUrl);
              } else {
                req.flash('message', 'Registered Successfully');
                res.redirect('/');
              }
            }
          })
        });
      });
    }
  });
});
router.get('/signin', function(req, res) {
  res.render('user/signin', {
    title: 'Shopping cart',
    csrfToken: req.csrfToken(),
    message: req.flash('message')
  });
})
router.post('/signin',
  passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/user/signin'
  }),
  function(req, res, next) {
    if (req.session.oldUrl) {
      var oldUrl = req.session.oldUrl;
      req.session.oldUrl = null;
      res.redirect(oldUrl);
    } else {
      res.redirect('/user/profile');
    }
  });

module.exports = router;
