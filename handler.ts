import { APIGatewayEvent, Callback, Context } from 'aws-lambda';
import * as request from 'request-promise';
import * as cheerio from 'cheerio';

export const getProduct = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
  const id = (event.queryStringParameters || {}).id || '';
  console.log('Request ID:', id);
  const match = id.match(/^(\w+)\:(.+)$/);
  if (!match) {
    return callback(null, { statusCode: 400, body: '"Missing or invalid ID"' });
  }
  switch (match[1]) {
    case 'waitrose':
      callback(null, handleResult(await fetchWaitrose(match[2])));
      break;
    case 'sainsburys':
      callback(null, handleResult(await fetchSainsburys(match[2])));
      break;
    default:
      return callback(null, { statusCode: 400, body: '"Unsupported supermarket"' });
  }
};

function handleResult(result: any) {
  if (!result) {
    return { statusCode: 404 };
  } else {
    return { statusCode: 200, body: JSON.stringify(result) };
  }
}

const fetchWaitrose = async (productId: string) => {
  const tokenBody = await request('https://www.waitrose.com/api/authentication-prod/v2/authentication/token');
  const result = JSON.parse(tokenBody);
  const { customerId, jwtString } = result.loginResult;

  const search = await request(`https://www.waitrose.com/api/custsearch-prod/v3/search/${customerId}/${productId}?orderId=0`, {
    headers: {
      authorization: jwtString
    }
  });

  console.log('Result:', search);

  const searchResult = JSON.parse(search);
  if (!searchResult.products.length) {
    return null;
  } else {
    const product = searchResult.products[0];
    return {
      name: product.name,
      price: product.currentSaleUnitPrice.price.amount
    };
  }
};

const fetchSainsburys = async (productLink: string) => {
  console.log('Requesting:', `https://www.sainsburys.co.uk/shop/gb/groceries/${productLink}`);
  const search = await request({ url: `https://www.sainsburys.co.uk/shop/gb/groceries/${productLink}`, jar: request.jar()}); // Need to pretend we want cookies, else the server refuses to serve us
  console.log('Result:', search);

  const $ = cheerio.load(search);

  const hasResult = $('.productContent').length > 0;
  if (!hasResult) {
    return null;
  }

  const price = $('.pricePerMeasure').text().replace(/[^\d.]+/g, '');
  const name = $('.productTitleDescriptionContainer h1').text();

  return {
    name, price
  };
};

//persil-powder-biological-425kg-%2850-washes%29
