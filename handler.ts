import { APIGatewayEvent, Callback, Context } from 'aws-lambda';
import { Waitrose } from './supermarkets/waitrose';
import { Sainsburys } from './supermarkets/sainsburys';
import { Supermarket } from './supermarkets/supermarket';

export const getProduct = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
  const id = (event.queryStringParameters || {}).id || '';
  console.log('Request ID:', id);
  const match = id.match(/^(\w+)\:(.+)$/);
  if (!match) {
    return callback(null, { statusCode: 400, body: '"Missing or invalid ID"' });
  }
  const productId = match[2];
  switch (match[1]) {
    case 'waitrose':
      callback(null, handleResult(await fetch(new Waitrose(), productId)));
      break;
    case 'sainsburys':
      callback(null, handleResult(await fetch(new Sainsburys(), productId)));
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

const fetch = async (supermarket: Supermarket, productId: string) => {
  await supermarket.init();
  const product = await supermarket.getProduct(productId);
  return product || null;
};
