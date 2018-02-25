import { Supermarket } from './supermarket';
import * as request from 'request-promise';
import { Product } from '../models/product.model';

export class Waitrose extends Supermarket {
  private customerId: string = '';
  private token: string = '';

  // size
  // 300ml
  // 1litre
  // 40x1 sheet
  // 3.185kg

  // displayPriceQualifier
  // (23.7p/100 sheets)
  // missing (1litre)
  // (£1.89/kg)

  public async init(): Promise<void> {
    const tokenBody = await request('https://www.waitrose.com/api/authentication-prod/v2/authentication/token');
    const result = JSON.parse(tokenBody);
    const { customerId, jwtString } = result.loginResult;
    this.customerId = customerId;
    this.token = jwtString;
  }

  public async getProduct(id: string): Promise<Product | null> {
    const search = await request(`https://www.waitrose.com/api/custsearch-prod/v3/search/${this.customerId}/${id}?orderId=0`, {
      headers: {
        authorization: this.token
      }
    });

    const searchResult = JSON.parse(search);
    if (!searchResult.products.length) {
      return null;
    } else {
      const result = searchResult.products[0];

      const product: Partial<Product> = {
        name: result.name,
        price: result.currentSaleUnitPrice.price.amount,
        ...getPrice(result)
      };

      return product as Product;
    }
  }
}

function getPrice(result: any): { pricePerUnit: number, unitName: string, isPence: boolean } {
  if (result.displayPriceQualifier) {
    const match = result.displayPriceQualifier.match(/\((£?[\d.]+|[\d.]+p)\/(.*)\)/i);
    if (match) {
      if (match[1][0] === '£') {
        return {
          pricePerUnit: parseFloat(match[1].slice(1)),
          unitName: match[2],
          isPence: false,
        };
      } else {
        return {
          pricePerUnit: parseFloat(match[1]) * 100,
          unitName: match[2],
          isPence: true
        };
      }
    }
  }

  return {
    pricePerUnit: result.currentSaleUnitPrice.price.amount,
    unitName: 'each',
    isPence: false
  }
}
