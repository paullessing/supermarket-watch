import { Injectable } from '@nestjs/common';
import { Product, SearchResult, SearchResultItem } from '@shoppi/api-interfaces';
import axios from 'axios';
import { Config } from '../config';
import { Supermarket } from './supermarket';
import { Waitrose as WaitroseData } from './waitrose-search.model';
import SearchResults = WaitroseData.SearchResults;
import isProduct = WaitroseData.isProduct;
import SingleResult = WaitroseData.SingleResult;

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

    const search = await axios.get<SingleResult>(`https://www.waitrose.com/api/custsearch-prod/v3/search/${this.customerId}/${id}?orderId=0`, {
      headers: {
        authorization: this.token
      }
    });

    const searchResult = search.data;
    if (!searchResult.products.length) {
      return null;
    } else {
      const result = searchResult.products[0];

      return transformSingleResult(this.getId(id), result);
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

    const response = await axios.post<SearchResults>(url, requestBody,
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
        .filter(isProduct)
        .map(({ searchProduct: product }: any): SearchResultItem => {

          const promotionalPrice = product.promotion?.promotionUnitPrice?.amount;

          return {
            id: this.getId(product.id),
            name: product.name,
            price: promotionalPrice || product.currentSaleUnitPrice.price.amount,
            image: product.thumbnail,
            supermarket: Waitrose.NAME,
            isSpecialOffer: !!promotionalPrice,
          };
        })
    };
  }
}

function transformSingleResult(id: string, result: SingleResult['products'][0]): Product {
  const promotionalPrice = result.promotion?.promotionUnitPrice?.amount;

  return {
    id,
    name: result.name,
    price: promotionalPrice || result.currentSaleUnitPrice.price.amount,
    supermarket: Waitrose.NAME,
    isSpecialOffer: !!promotionalPrice,
    ...getPrice(result)
  };
}

function getPrice(result: any): { pricePerUnit: number, unitAmount: number, unitName: string } {
  if (result.displayPriceQualifier) {
    const match = result.displayPriceQualifier.match(/\((£?[\d.]+|[\d.]+p)\/(.*)\)/i);
    if (match) {
      const [, unitAmountString, unitName] = match[2].match(/^(\d*)([^\d].*)$/);
      const unitAmount = parseFloat(unitAmountString?.trim() || '') || 1;
      const pricePerUnit = match[1][0] === '£' ?
        parseFloat(match[1].slice(1)) :
        parseFloat(match[1].slice(0, -1)) / 100;

      return {
        unitAmount,
        pricePerUnit,
        unitName: unitName.trim(),
      };
    }
  }

  return {
    pricePerUnit: result.currentSaleUnitPrice.price.amount,
    unitAmount: 1,
    unitName: 'each',
  };
}
