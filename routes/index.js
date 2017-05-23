var express = require('express');
var Product = require('../models/product');
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
module.exports = router;
