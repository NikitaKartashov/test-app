const { Router } = require('express');
const axios = require('axios');
const Shop = require('../models/Shop');

const router = new Router();

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_SCOPES,
  SHOPIFY_REDIRECT_URI,
  NONCE,
} = process.env;

router.use(async (req, res, next) => {
  const shop = req.cookies.shopDomain;
  if (!shop) {
    return next();
  }
  const foundShop = await Shop.findOne({ shopDomain: shop });
  if (foundShop) {
    req._shop = foundShop;
  }
  next();
});

router.get('/', async (req, res) => {
  if (!req._shop) {
    res.redirect('/login');
  } else {
    const foundShop = await Shop.findOne({ shopDomain: req._shop.shopDomain });
    const productsResponse = await axios.get(
      `https://${req._shop.shopDomain}/admin/api/2022-10/products/count.json`,
      { headers: { 'x-shopify-access-token': foundShop.accessToken } }
    );
    const ordersResponse = await axios.get(
      `https://${req._shop.shopDomain}/admin/api/2022-10/orders/count.json`,
      { headers: { 'x-shopify-access-token': foundShop.accessToken } }
    );
    const customersResponse = await axios.get(
      `https://${req._shop.shopDomain}/admin/api/2022-10/customers/count.json`,
      { headers: { 'x-shopify-access-token': foundShop.accessToken } }
    );
    res.render('storePage', {
      productsCount: productsResponse.data.count,
      ordersCount: ordersResponse.data.count,
      customersCount: customersResponse.data.count,
      shopDomain: req._shop.shopDomain,
    });
  }
});

router.get('/login', (req, res) => {
  res.render('loginPage', {
    header: 'Welcome',
  });
});

router.post('/oauth/shopify', async (req, res) => {
  const { shopDomain } = req.body;
  const url = `https://${shopDomain}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SHOPIFY_SCOPES}&redirect_uri=${SHOPIFY_REDIRECT_URI}&state=${NONCE}`;
  res.redirect(url);
});

router.get('/oauth/shopify/callback', async (req, res) => {
  const { code } = req.query;
  const { shop } = req.query;
  const url = `https://${req.query.shop}/admin/oauth/access_token?client_id=${SHOPIFY_API_KEY}&client_secret=${SHOPIFY_API_SECRET_KEY}&code=${code}`;
  const response = await axios.post(url);
  const foundShop = await Shop.findOne({ shopDomain: shop });
  if (foundShop) {
    foundShop.accessToken = response.data.access_token;
  } else {
    const newShop = new Shop({
      shopDomain: req.query.shop,
      accessToken: response.data.access_token,
    });
    await newShop.save();
  }
  res
    .cookie('shopDomain', req.query.shop, {
      domain: '.eu.ngrok.io',
      expires: new Date(Date.now() + 150000),
    })
    .redirect(`/?shop=${shop}`);
});

router.get('/productsPage', async (req, res) => {
  const id = Number(req.query.sinceId);
  const { shop } = req.query;
  const foundShop = await Shop.findOne({ shopDomain: shop });
  const productsResponse = await axios.get(
    `https://${foundShop.shopDomain}/admin/api/2022-10/products.json?limit=5&since_id=${id}`,
    {
      headers: { 'x-shopify-access-token': foundShop.accessToken },
    }
  );
  res.render('productsPage', {
    header: 'Our products',
    products: productsResponse.data.products,
    prev: productsResponse.data.products[0],
    next: productsResponse.data.products[
      productsResponse.data.products.length - 1
    ],
    shopDomain: foundShop.shopDomain,
  });
});

router.get('/product/:productId', async (req, res) => {
  const { shop } = req.query;
  const { productId } = req.params;
  const foundShop = await Shop.findOne({ shopDomain: shop });
  const productResponse = await axios.get(
    `https://${foundShop.shopDomain}/admin/api/2022-10/products/${productId}.json`,
    {
      headers: { 'x-shopify-access-token': foundShop.accessToken },
    }
  );
  res.render('product', {
    header: productResponse.data.product.title,
    id: productResponse.data.product.id,
    title: productResponse.data.product.title,
    img: productResponse.data.product.image.src,
    options: productResponse.data.product.options,
    description: productResponse.data.product.body_html,
  });
});

module.exports = router;
