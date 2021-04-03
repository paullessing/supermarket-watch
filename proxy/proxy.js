#!/usr/bin/env node
const { exec } = require('child_process');
const express = require('express');
const app = express();

const tescoUrl = 'https://www.tesco.com/groceries/en-GB/products/';
const curlHeaders = [
  'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
  'accept-language: en-GB,en-US;q=0.9,en;q=0.8,de;q=0.7',
].map((h) => `-H '${h}'`).join(' ');
const port = 3333;

app.get('/tesco/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).end();
    }
    console.log(`Fetching ${productId}`);
    exec(`curl '${tescoUrl}${productId}' ${curlHeaders} --compressed`,
      (error, stdout) => {
        if (error) {
          res.status(500).send(error.toString());
        } else {
          res.send(stdout.toString());
        }
      }
    );
  } catch (e) {
    console.log(e);
    res.status(500).send(e.toString()).end();
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
});
