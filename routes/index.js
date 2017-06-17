var Product = require('../models/product');
var express = require('express');
var Order = require('../models/order');
var router = express.Router();
router.get('/', function(req, res, next) {
  //console.log(req.csrfToken());
  Product.find(function(err, docs) {
    if (err)
      console.log(err);
    else {
      //console.log(docs)
      var docsPartition = [];
      var partitionSize = 3;
      for (var i = 0; i < docs.length; i += partitionSize) {
        docsPartition.push(docs.slice(i, i + partitionSize));
      }
      res.render('shop/index', {
        title: 'Shopping cart',
        products: docsPartition,
        message: req.flash('message')
      });
    }
  });
});

router.get('/add-to-cart/:id', function(req, res) {
  var itemId = req.params.id;
  Product.findById(itemId, function(err, item) {
    if (err) {
      res.send("Product not found error");
    } else {
      if (req.session.cart) {
        var itemObj = {};
        itemObj.title = item.title;
        itemObj.id = item.id;
        itemObj.price = item.price;
        itemObj.quantity = 1;
        var itemPresent = 0;
        var indexOfItem = -1;
        var cartUpdate = req.session.cart;
        for (var i = 0; i < cartUpdate.length; i++) {
          if (cartUpdate[i].id === item.id) {
            itemPresent = 1;
            indexOfItem = i;
            break;
          }
        }
        if (itemPresent === 0) {
          cartUpdate.push(itemObj);
        } else {
          cartUpdate[indexOfItem].price += itemObj.price;
          cartUpdate[indexOfItem].quantity += 1;
        }
        req.session.cart = cartUpdate;
      } else {
        var newCart = [];
        var itemObj = {};
        itemObj.title = item.title;
        itemObj.id = item.id;
        itemObj.price = item.price;
        itemObj.quantity = 1;
        newCart.push(itemObj);
        req.session.cart = newCart;
      }
    }
    //console.log(req.session.cart);
    var totalQuantity = 0;
    for (var i = 0; i < req.session.cart.length; i++) {
      totalQuantity += req.session.cart[i].quantity;
    }
    //  console.log(totalQuantity);
    res.redirect('/');
  })
});
router.get('/reduce/:id', function(req, res, next) {
  var itemId = req.params.id;
  var cart = req.session.cart;
  var itemPrice = 0;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === itemId) {
      if (cart[i].quantity === 1)
        cart.splice(i, 1);
      else {
        itemPrice = cart[i].price / cart[i].quantity;
        cart[i].quantity = cart[i].quantity - 1;
        cart[i].price = cart[i].price - itemPrice;
      }
      break;
    }
  }
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

router.get('/remove/:id', function(req, res, next) {
  var itemId = req.params.id;
  var cart = req.session.cart;
  var itemPrice = 0;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === itemId) {
      cart.splice(i, 1);
      break;
    }
  }
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

router.get('/shopping-cart', function(req, res, next) {
  var totalPrice = 0;
  var totalQuantity = 0;
  if (req.session.cart)
    for (var i = 0; i < req.session.cart.length; i++) {
      totalPrice += req.session.cart[i].price;
      totalQuantity += req.session.cart[i].quantity;
    }
  var Cart = 0;
  if (totalQuantity === 0)
    Cart = null;
  else {
    Cart = req.session.cart;
  }
  res.render('shop/shopping-cart', {
    title: 'Shopping cart',
    products: Cart,
    totalPrice: totalPrice,
    totalQuantity: totalQuantity
  });
});

router.get('/checkout', ensureAuthenticated, function(req, res, next) {
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }
  var totalPrice = 0;
  var Cart = req.session.cart;
  for (var i = 0; i < Cart.length; i++)
    totalPrice += Cart[i].price;

  res.render('shop/checkout', {
    total: totalPrice,
    title: 'Shopping cart'
  });
});

router.post('/checkout', ensureAuthenticated, function(req, res, next) {
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }
  var order = new Order({
    user: req.user,
    cart: req.session.cart,
    address: req.body.address,
    name: req.body.name,
    paymentId: Math.random().toString(36).substr(2, 5) + Date.now()
  });
  order.save(function(err, result) {
    req.flash('message', 'Successfully bought product!');
    req.session.cart = null;
    res.redirect('/');
  });
});

module.exports = router;

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
  }
};
