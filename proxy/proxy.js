#!/usr/bin/env node
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');
const compression = require('compression');
const express = require('express');
const { readdirSync, rmSync } = require('fs');

const port = 3333;

const tescoUrl = 'https://www.tesco.com/groceries/en-GB/';
const sainsburysUrl =
  'https://www.sainsburys.co.uk/groceries-api/gol-services/product/v1/';
const waitroseUrls = {
  search: `https://www.waitrose.com/api/content-prod/v2/cms/publish/productcontent/search/${-1 /*customerId*/}`,
  product: `https://www.waitrose.com/ecom/products/name`,
};

const userAgent = {
  value: null,
  fetched: Number.MIN_SAFE_INTEGER,
  async get() {
    const fetchedDiffDays = Math.floor(
      (new Date().getTime() - this.fetched) / 24 / 3600 / 1000
    );
    if (!this.value || fetchedDiffDays >= 1) {
      this.value = await getRandomFirefoxUserAgent();
      this.fetched = new Date().getTime();
    }
    return this.value;
  },
};

async function getRandomFirefoxUserAgent() {
  const res = await fetch(
    'https://product-details.mozilla.org/1.0/firefox_versions.json'
  );
  if (!res.ok) throw new Error(`Failed to fetch version: ${res.status}`);
  const data = await res.json();

  const baseVersion = data.LATEST_FIREFOX_VERSION; // e.g., "140.0.2"
  const [major, minor = 0, patch = 0] = baseVersion.split('.').map(Number);

  // Slight random version offset (simulate recent version)
  const randomMajor = major + [0, 0, 0, 1, -1][Math.floor(Math.random() * 5)]; // ±1 or same
  const randomMinor = Math.floor(Math.random() * 3); // 0 to 2
  const version = `${randomMajor}.${randomMinor}`;

  // Platform variations
  const platforms = [
    `Windows NT 10.0; Win64; x64`,
    `Windows NT 10.0; WOW64`,
    `Macintosh; Intel Mac OS X 10_${14 + Math.floor(Math.random() * 4)}_${Math.floor(Math.random() * 10)}`,
    `X11; Linux x86_64`,
    `X11; Ubuntu; Linux x86_64`,
  ];
  const platform = platforms[Math.floor(Math.random() * platforms.length)];

  // Build UA string
  return `Mozilla/5.0 (${platform}; rv:${version}) Gecko/20100101 Firefox/${version}`;
}

async function getCurlHeaders() {
  return [
    `User-Agent: ${await userAgent.get()}`,
    'Accept-Language: en-GB,en;q=0.5',
  ]
    .reduce((acc, curr) => acc.concat('-H', curr), [])
    .map((value, i, arr) => {
      // debug
      // if (i === 0) {
      //   console.log(arr);
      // }
      return value;
    });
}

// Clean up previous temp files
const oldFiles = readdirSync('/tmp').filter(
  (name) => name.startsWith('Temp-') || name.startsWith('puppeteer_dev_')
);
console.log(`Deleting ${oldFiles.length} old and temporary directories`);
for (const oldFile of oldFiles) {
  console.log('Deleting:', '/tmp/' + oldFile);
  rmSync('/tmp/' + oldFile, { force: true, recursive: true });
}

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

/**
 * Loads a page using Puppeteer
 */
async function loadPageViaBrowser(url) {
  const browserWrapper = await getBrowser();
  console.log(`Using puppeteer browser #${browserWrapper.index}`);
  const browser = browserWrapper.use();
  try {
    const start = new Date().getTime();
    const page = await browser.newPage();
    await page.setUserAgent(await userAgent.get());
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

async function streamFromUrl(url, resOrCurlArgs, maybeRes) {
  const args = maybeRes ? resOrCurlArgs : {};
  const res = maybeRes ?? resOrCurlArgs;
  const curlArgs = [
    '-L',
    ...(await getCurlHeaders()),
    ...Object.entries(args.headers ?? {}).flatMap(([key, value]) => [
      '-H',
      `${key}: ${value}`,
    ]),
  ];

  if (args.post) {
    curlArgs.push('-X', 'POST');
    if (args.body) {
      curlArgs.push('--data-raw', JSON.stringify(args.body));
    }
  }

  return await new Promise(async (resolve, reject) => {
    let bytes = 0;
    const curl = spawn('curl', [url, '--compressed', ...curlArgs]);
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

app.get('/health', (req, res) => res.status(200).end('ALLOK'));

app.get('/tesco/product/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).end();
    }
    console.log(`Tesco: Fetching ${productId}`);
    const result = await streamFromUrl(
      `${tescoUrl}products/${encodeURIComponent(productId)}`,
      res
    );

    console.log(`Tesco: Got ${result.length} bytes`);
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

app.get('/waitrose/ecom/products/:name/:productId', async (req, res) => {
  try {
    const productId = '' + (req.params.productId ?? '');

    if (!productId) {
      return res.status(400).end();
    }
    console.log(`Waitrose: Fetching ${productId}`);

    const result = await streamFromUrl(
      `${waitroseUrls.product}/${encodeURIComponent(productId)}`,
      res
    );

    console.log(`Waitrose: Got ${result} bytes`);
    res.end();
  } catch (e) {
    console.log(e);
    res.status(500).send(e.toString()).end();
  }
});

app.post(
  '/waitrose/api/content-prod/v2/cms/publish/productcontent/search/:customerId',
  express.json(),
  async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId, 10);
      if (isNaN(customerId)) {
        return res.status(400).end();
      }

      console.log(
        `Waitrose: Searching ${req.body?.customerSearchRequest?.queryParams?.searchTerm}`
      );

      const result = await streamFromUrl(
        `${waitroseUrls.search}?${new URLSearchParams(req.query ?? {}).toString()}`,
        {
          post: true,
          headers: {
            authorization: req.headers?.authorization,
            Connection: 'keep-alive',
          },
          body: req.body,
        },
        res
      );

      console.log(`Waitrose: Got ${result} bytes`);
      res.end();
    } catch (e) {
      console.log(e);
      res.status(500).send(e.toString()).end();
    }
  }
);

console.log('Launching Puppeteer...');
Promise.all(
  new Array(5).fill(null).map((_, i) =>
    puppeteer
      .launch({
        browser: 'firefox',
        executablePath: '/usr/bin/firefox',
        headless: true,
        defaultViewport: null,
        args: [` --profile /tmp/firefox_profile_${i}`],
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
