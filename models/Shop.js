const { Schema, model } = require('mongoose');

const Shop = new Schema({
  shopDomain: {
    type: String,
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = model('Shop', Shop);
