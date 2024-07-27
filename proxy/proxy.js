#!/usr/bin/env node
const puppeteer = require('puppeteer');

const compression = require('compression');
const express = require('express');
const app = express();

const tescoUrl = 'https://www.tesco.com/groceries/en-GB/';
const sainsburysUrl = 'https://www.sainsburys.co.uk/groceries-api/gol-services/product/v1/';

const port = 3333;

/**
 * @type puppeteer.Browser
 */
let browser;

async function loadPage(url) {
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36'
  );
  await page.goto(url, { waitUntil: 'networkidle0' });

  const data = await page.content();

  return data;
}

app.use(compression());
app.get('/tesco/product/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).end();
    }
    console.log(`Fetching ${productId}`);
    const result = await loadPage(`${tescoUrl}products/${encodeURIComponent(productId)}`);

    res.send(result);

    console.log(`Got ${result.length} bytes`);
    res.end();
  } catch (e) {
    console.log(e);
    res.status(500).send(e.toString()).end();
  }
});

app.get('/tesco/search', async (req, res) => {
  try {
    const queryString = req.query.query;
    if (!queryString) {
      console.log('Tesco: Query string not found');
      return res.status(400).end();
    }
    console.log(`Tesco: Searching "${queryString}"`);
    const result = await loadPage(`${tescoUrl}search?query=${encodeURIComponent(queryString)}`);

    res.send(result);

    console.log(`Tesco: Got ${result.length} bytes`);
    res.end();
  } catch (e) {
    console.log(e);
    res.status(500).send(e.toString()).end();
  }
});

app.get('/sainsburys/product', async (req, res) => {
  try {
    const queryIndex = req.originalUrl.indexOf('?');
    const queryString = queryIndex >= 0 ? req.originalUrl.slice(queryIndex + 1) : '';

    if (!queryString) {
      console.log('Sainsburys: Query string not found');
      return res.status(400).end();
    }
    console.log(`Sainsburys: Searching "${queryString}"`);
    const result = await loadPage(`${sainsburysUrl}product?${queryString}`);

    res.send(result);
    console.log(`Sainsburys: Got ${result.length} bytes`);
    res.end();
  } catch (e) {
    console.log(e);
    res.status(500).send(e.toString()).end();
  }
});

console.log('Launching Puppeteer...');
puppeteer
  .launch()
  .then((_browser) => {
    browser = _browser;
    console.log('Puppeteer is started');

    console.log('Starting express...');
    app.listen(port, () => {
      console.log(`App listening at http://localhost:${port}`);
    });
  })
  .catch((e) => {
    console.error('An error has occurred:', e);
    process.exit(1);
  });
