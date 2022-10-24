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
  const { hmac } = req.query;
  const { shop } = req.query;
  const url = `https://${req.query.shop}/admin/oauth/access_token?client_id=${SHOPIFY_API_KEY}&client_secret=${SHOPIFY_API_SECRET_KEY}&code=${code}`;
  const response = await axios.post(url);
  const findShop = await Shop.findOne({ shop });
  if (findShop) {
    Shop.accessToken = response.data.access_token;
  } else {
    const newShop = await new Shop({
      shopDomain: req.query.shop,
      accessToken: response.data.access_token,
    });
    await newShop.save();
  }
  res.render('storePage', {
    header: `Welcome, ${BRAND_NAME}`,
  });
});

router.get('/admin/api/2022-10/customers/count.json', async (req, res) => {
  const { shop } = req.query;
  const responce = await Shop.findOne({ shop });
  const token = responce.accessToken;
  // res.json({ token });
  if (token) {
    // const countCustomers = await axios.get(
    //   `https://${req.query.shop}/admin/api/2022-10/customers/count.json?access_token=${token}`
    // );
    // res.json(countCustomers);
    res.redirect(
      `https://${responce.shopDomain}/admin/api/2022-10/customers/count.json`
    );
  }
});
router.get('/productsPage', (req, res) => {
  res.render('productsPage', {
    header: 'Our products',
  });
});

module.exports = router;
