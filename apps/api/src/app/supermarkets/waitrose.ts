import { Injectable } from '@nestjs/common';
import { Product, SearchResult, SearchResultItem } from '@shoppi/api-interfaces';
import axios from 'axios';
import { Config } from '../config.service';
import { Supermarket } from './supermarket';

@Injectable()
export class Waitrose extends Supermarket {

  public static readonly NAME = 'Waitrose';

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

  constructor(private config: Config) {
    super();
  }

  public getPrefix(): string {
    return 'waitrose';
  }

  private async init(): Promise<void> {
    if (this.token) {
      return;
    }
    this.customerId = '-1';
    this.token = 'Bearer unauthenticated';
    // const response = await axios.get('https://www.waitrose.com/api/authentication-prod/v2/authentication/token');
    // const { customerId, jwtString } = response.data.loginResult;
    // this.customerId = customerId;
    // this.token = jwtString;
  }

  public async getProduct(id: string): Promise<Product | null> {
    await this.init();

    const search = await axios.get(`https://www.waitrose.com/api/custsearch-prod/v3/search/${this.customerId}/${id}?orderId=0`, {
      headers: {
        authorization: this.token
      }
    });

    const searchResult = search.data;
    if (!searchResult.products.length) {
      return null;
    } else {
      const result = searchResult.products[0];

      return transformSingleResult(id, result);
    }
  }

  public async search(term: string): Promise<SearchResult> {
    await this.init();

    const url = `https://www.waitrose.com/api/content-prod/v2/cms/publish/productcontent/search/${this.customerId}?clientType=WEB_APP`;
    const requestBody = {
      customerSearchRequest: {
        queryParams: {
          size: this.config.searchResultCount,
          searchTerm: term,
          sortBy: 'RELEVANCE',
          searchTags: [],
          filterTags: [],
          orderId: '0'
        }
      }
    };

    const response = await axios.post(url, requestBody,
    {
      headers: {
        authorization: this.token
      }
    });

    if (!response) {
      return { items: [] };
    }

    return {
      items: (response.data.componentsAndProducts || [])
        .filter((item: any) => item && item.searchProduct)
        .map(({ searchProduct: product }: any): SearchResultItem => {
          const item: SearchResultItem = {
            id: `${this.getPrefix()}:${product.id}`,
            name: product.name,
            price: product.currentSaleUnitPrice.price.amount,
            image: product.thumbnail,
            supermarket: Waitrose.NAME,
          };
          return item;
        })
    };
  }
}

function transformSingleResult(id: string, result: any): Product {
  return {
    id,
    name: result.name,
    price: result.promotion?.promotionUnitPrice?.amount || result.currentSaleUnitPrice.price.amount,
    supermarket: Waitrose.NAME,
    ...getPrice(result)
  };
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
