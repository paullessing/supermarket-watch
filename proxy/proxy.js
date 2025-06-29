#!/usr/bin/env node
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');
const compression = require('compression');
const express = require('express');

const port = 3333;

const tescoUrl = 'https://www.tesco.com/groceries/en-GB/';
const sainsburysUrl =
  'https://www.sainsburys.co.uk/groceries-api/gol-services/product/v1/';

const curlHeaders = [
  'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Accept-Language: en-GB,en;q=0.5',
].reduce((acc, curr) => acc.concat('-H', curr), []);

const app = express();
/**
 * @type {BrowserWrapper[]}
 */
let browsers = [];

/**
 * @returns {Promise<BrowserWrapper>}
 */
async function getBrowser() {
  return Promise.any(browsers.map((wrapper) => wrapper.wait()));
}

class BrowserWrapper {
  constructor(browser, index) {
    this.browser = browser;
    this.index = index;
  }
  use() {
    this.pendingPromise = createPendingPromise();
    return this.browser;
  }
  done() {
    this.pendingPromise = null;
  }
  async wait() {
    await this.pendingPromise?.promise;
    return this;
  }
}

function createPendingPromise() {
  let result = {};
  result.promise = new Promise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });
  return result;
}

async function loadPage(url) {
  const browserWrapper = await getBrowser();
  console.log(`Using browser #${browserWrapper.index}`);
  const browser = browserWrapper.use();
  try {
    const start = new Date().getTime();
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36'
    );
    await page.goto(url);

    const data = await page.content();

    console.info(`Loaded page in ${new Date().getTime() - start}ms.`);

    return data;
  } finally {
    const cookies = await browser.cookies();
    await browser.deleteCookie(...cookies);
    browserWrapper.done();
  }
}

async function streamFromUrl(url, res) {
  return await new Promise((resolve, reject) => {
    let bytes = 0;
    const curl = spawn('curl', [url, ...curlHeaders, '--compressed']);
    curl.stdout.on('data', (chunk) => {
      res.write(chunk);
      bytes += `${chunk}`.length;
    });

    curl.on('error', (err) => reject(err));

    curl.on('close', (code) => {
      if (code && code > 0) {
        reject(new Error('Non-Zero status code: ' + code));
      } else {
        resolve(bytes);
      }
    });
  });
}

app.use(compression());
app.get('/tesco/product/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).end();
    }
    console.log(`Fetching ${productId}`);
    const result = await loadPage(
      `${tescoUrl}products/${encodeURIComponent(productId)}`
    );

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
    const result = await streamFromUrl(
      `${tescoUrl}search?query=${encodeURIComponent(queryString)}`,
      res
    );

    console.log(`Tesco: Got ${result} bytes`);
    res.end();
  } catch (e) {
    console.log(e);
    res.status(500).send(e.toString()).end();
  }
});

app.get('/sainsburys/product', async (req, res) => {
  try {
    const queryIndex = req.originalUrl.indexOf('?');
    const queryString =
      queryIndex >= 0 ? req.originalUrl.slice(queryIndex + 1) : '';

    if (!queryString) {
      console.log('Sainsburys: Query string not found');
      return res.status(400).end();
    }
    console.log(`Sainsburys: Searching "${queryString}"`);
    const result = await streamFromUrl(
      `${sainsburysUrl}product?${queryString}`,
      res
    );

    console.log(`Sainsburys: Got ${result} bytes`);
    res.end();
  } catch (e) {
    console.log(e);
    res.status(500).send(e.toString()).end();
  }
});

console.log('Launching Puppeteer...');
Promise.all(
  new Array(5).fill(null).map((_, i) =>
    puppeteer
      .launch({
        browser: 'firefox',
        executablePath: '/usr/bin/firefox',
        headless: true,
        defaultViewport: null,
      })
      .then(
        (browser) => {
          console.log(`Puppeteer #${i} is started`);
          return new BrowserWrapper(browser, i);
        },
        (e) => {
          console.log(`Failed to start Puppeteer #${i}`);
          console.error(e);
          throw e;
        }
      )
  )
)
  .then((_browsers) => {
    browsers = _browsers;
  })
  .then(() => {
    console.log('Starting express...');
    app.listen(port, () => {
      console.log(`App listening at http://localhost:${port}`);
    });
  })
  .catch((e) => {
    console.error('An error has occurred:', e);
    process.exit(1);
  });
