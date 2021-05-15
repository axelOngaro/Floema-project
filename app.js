const dotenv = require('dotenv');
const express = require('express');
const errorHandler = require('errorhandler');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const logger = require('morgan');
const path = require('path');
const port = 3000;

app.use(logger('dev'));
app.use(errorHandler());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());

const Prismic = require('@prismicio/client');
var PrismicDOM = require('prismic-dom');
const { cpus } = require('os');

dotenv.config();
const app = express();

const initApi = (req) => {
  return Prismic.getApi(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req,
  });
};

const handleLinkResolver = (doc) => {
  //   // Define the url depending on the document type
  //   if (doc.type === 'page') {
  //     return '/page/' + doc.uid;
  //   } else if (doc.type === 'blog_post') {
  //     return '/blog/' + doc.uid;
  //   }
  //   // Default to homepage
  //   return '/';
};

// Middleware to inject prismic context
app.use((req, res, next) => {
  res.locals.ctx = {
    endpoint: process.env.PRISMIC_ENDPOINT,
    linkResolver: handleLinkResolver,
  };
  res.locals.PrismicDOM = PrismicDOM;
  next();
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', async (req, res) => {
  res.render('pages/home');
});

app.get('/about', async (req, res) => {
  const api = await initApi(req);
  const preloader = await api.getSingle('preloader');
  const about = await api.getSingle('about');
  const metadata = await api.getSingle('metadata');

  res.render('pages/about', {
    about,
    metadata,
    preloader,
  });
});

app.get('/detail/:uid', async (req, res) => {
  const api = await initApi(req);
  const preloader = await api.getSingle('preloader');
  const metadata = await api.getSingle('metadata');
  const product = await api.getByUID('product', req.params.uid, {
    fetchLinks: 'collection.title',
  });

  res.render('pages/detail', {
    metadata,
    preloader,
    product,
  });
});
app.get('/collections', async (req, res) => {
  const api = await initApi(req);
  const preloader = await api.getSingle('preloader');
  const metadata = await api.getSingle('metadata');
  const home = await api.getSingle('home');

  const { results: collections } = await api.query(
    Prismic.Predicates.at('document.type', 'collection'),
    {
      fetchLinks: 'product.image',
    }
  );

  console.log(collections);

  res.render('pages/collections', {
    metadata,
    collections,
    home,
    preloader,
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
