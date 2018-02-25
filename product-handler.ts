import { Waitrose } from './supermarkets/waitrose';
import { Sainsburys } from './supermarkets/sainsburys';
import { Supermarket } from './supermarkets/supermarket';
import { HandlerRequest, HandlerResponse } from 'serverless-api-handlers';
import { SearchableItem } from './models/searchable-item.model';

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
