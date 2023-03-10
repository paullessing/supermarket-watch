#!/usr/bin/env node
const { spawn } = require('child_process');
const express = require('express');
const app = express();

const tescoUrl = 'https://www.tesco.com/groceries/en-GB/';
const curlHeaders = [
  'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
  'accept-language: en-GB,en-US;q=0.9,en;q=0.8,de;q=0.7',
].reduce((acc, curr) => acc.concat('-H', curr), []);
const port = 3334;

async function fetchFromUrl(url) {
  return await new Promise((resolve, reject) => {
    const data = [];
    const curl = spawn('curl', [`${tescoUrl}${url}`, ...curlHeaders, '--compressed']);
    curl.stdout.on('data', (chunk) => {
      data.push(chunk);
    });

    curl.on('error', (err) => reject(err));

    curl.on('close', (code) => {
      if (code && code > 0) {
        reject(new Error('Non-Zero status code: ' + code));
      } else {
        resolve(data.join(''));
      }
    });
  });
}

app.get('/tesco/product/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).end();
    }
    console.log(`Fetching ${productId}`);
    const result = await fetchFromUrl(`products/${encodeURIComponent(productId)}`);

    console.log(`Got ${result.length} bytes`);
    res.send(result);
  } catch (e) {
    console.log(e);
    res.status(500).send(e.toString()).end();
  }
});

app.get('/tesco/search', async (req, res) => {
  try {
    const queryString = req.query.query;
    if (!queryString) {
      return res.status(400).end();
    }
    console.log(`Searching "${queryString}"`);
    const result = await fetchFromUrl(`search?query=${encodeURIComponent(queryString)}`);

    console.log(`Got ${result.length} bytes`);
    res.send(result);
  } catch (e) {
    console.log(e);
    res.status(500).send(e.toString()).end();
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
