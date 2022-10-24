const { Router } = require('express');
const axios = require('axios');
const Shop = require('../models/Shop');

const router = new Router();

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_SCOPES,
  SHOPIFY_REDIRECT_URI,
  BRAND_NAME,
  NONCE,
} = process.env;


router.get('/', (req, res) => {
  // check if no req.query.shop then res.redirect('/login');
  // else find foundShop = await Shop.findOne({ shopDomain: shop })
  // use accessToken
  // do 3 request
  // Hint how to fetch resource - count products (const productsResponse = await axios.get(`https://${foundShop.shopDomain}/admin/products/count.json`, { headers: { 'x-shopify-access-token': foundShop.accessToken }  }))
  // - count orders
  // - count customers
  // res.render('page', { productsCount: productsResponse.data.count, ordersCount: ordersResponse.data.count  })
});

router.get('/login', (req, res) => {
  res.render('loginPage', {
    header: 'Welcome',
  });
});

router.post('/oauth/shopify', async (req, res) => {
  const { shopDomain } = req.body;
  const url = `https://${shopDomain}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SHOPIFY_SCOPES}&redirect_uri=${SHOPIFY_REDIRECT_URI}&state=${NONCE}`;
  await res.redirect(url);
});

router.get('/oauth/shopify/callback', async (req, res) => {
  const { code } = req.query;
  const { shop } = req.query;
  const url = `https://${req.query.shop}/admin/oauth/access_token?client_id=${SHOPIFY_API_KEY}&client_secret=${SHOPIFY_API_SECRET_KEY}&code=${code}`;
  const response = await axios.post(url);

  const foundShop = await Shop.findOne({ shop });

  if (foundShop) {
    foundShop.accessToken = response.data.access_token;
    await foundShop.save();
    // await Shop.updateOne({ _id: foundShop._id }, { accessToken: response.data.access_token }});

  } else {
    const newShop = new Shop({
      shopDomain: req.query.shop,
      accessToken: response.data.access_token,
    });

    await newShop.save();
  }
  //
  res.redirect('/?shop=' + shop);
});


module.exports = router;
