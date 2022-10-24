require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
// const { Shopify } = require("@shopify/shopify-api");
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mainRoutes = require('./routes/main');

const PORT = process.env.PORT || 3000;

const app = express();
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(mainRoutes);

async function start() {
  try {
    await mongoose.connect(
      'mongodb+srv://Nikita:q1w2e3r4t5@cluster0.2saaolr.mongodb.net/shop',
      {}
    );
    app.listen(PORT, () => {
      console.log(`Server has been listening on port ${PORT}`);
    });
  } catch (e) {
    console.log(e);
  }
}

start();
