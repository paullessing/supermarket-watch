import { APIGatewayEvent, Callback, Context } from 'aws-lambda';
import * as request from 'request-promise';

export const getProduct = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
  const id = (event.queryStringParameters || {}).id || '';
  console.log('Request ID:', id);
  const match = id.match(/^(\w+)\:([\w-]+)$/);
  if (!match) {
    return callback(null, { statusCode: 400, body: '"Missing or invalid ID"' });
  }
  switch (match[1]) {
    case 'waitrose':
      const result = await fetchWaitrose(match[2]);
      callback(null, { statusCode: 200, body: JSON.stringify(result) });
      break;
    default:
      return callback(null, { statusCode: 400, body: '"Unsupported supermarket"' });
  }
};

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
  return searchResult.products[0];
};
