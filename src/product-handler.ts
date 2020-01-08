import { Waitrose } from './supermarkets/waitrose';
import { Sainsburys } from './supermarkets/sainsburys';
import { Supermarket } from './supermarkets/supermarket';
import { HandlerRequest, HandlerResponse } from 'serverless-api-handlers';

export const getProduct = async (request: HandlerRequest): Promise<HandlerResponse> => {
  const id = request.queryParameters.id as string || '';
  console.log('Request ID:', id);
  const match = id.match(/^(\w+)\:(.+)$/);
  if (!match) {
    return { statusCode: 400, body: 'Missing or invalid ID' };
  }
  const productId = match[2];
  switch (match[1]) {
    case 'waitrose':
      return handleResult(await fetch(new Waitrose(), productId));
    case 'sainsburys':
      return handleResult(await fetch(new Sainsburys(), productId));
    default:
      return { statusCode: 400, body: '"Unsupported supermarket"' };
  }
};

export const search = async (request: HandlerRequest): Promise<HandlerResponse> => {
  const waitrose = new Waitrose();
  const sainsburys = new Sainsburys();
  const query = request.queryParameters.q as string;

  const [waitroseResults, sainsburysResults] = await Promise.all([waitrose.search(query), sainsburys.search(query)]);

  const result = {
    supermarkets: [{
      name: 'Waitrose',
      items: waitroseResults.items
    }, {
      name: `Sainsbury's`,
      items: sainsburysResults.items
    }]
  };

  return handleResult(result); // TODO copy makeResponse() method
};

function handleResult(result: any) {
  if (!result) {
    return { statusCode: 404, headers: { 'Access-Control-Allow-Origin': '*' } };
  } else {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(result) };
  }
}

const fetch = async (supermarket: Supermarket, productId: string) => {
  const product = await supermarket.getProduct(productId);
  return product || null;
};
