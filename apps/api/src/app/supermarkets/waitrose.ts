import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Product, SearchResult, SearchResultItem } from '@shoppi/api-interfaces';
import { Config } from '../config';
import { Supermarket } from './supermarket';
import { isProduct, SearchResults, SingleResult } from './waitrose-search.model';

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

  constructor(private readonly config: Config) {
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

    const search = await axios.get<SingleResult>(
      `https://www.waitrose.com/api/custsearch-prod/v3/search/${this.customerId}/${id}?orderId=0`,
      {
        headers: {
          authorization: this.token,
        },
      }
    );

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
          orderId: '0',
        },
      },
    };

    const response = await axios.post<SearchResults>(url, requestBody, {
      headers: {
        authorization: this.token,
      },
    });

    if (!response) {
      return { items: [] };
    }

    return {
      items: (response.data.componentsAndProducts || [])
        .filter(isProduct)
        .map(({ searchProduct: product }): SearchResultItem => {
          const promotionalPrice = product.promotion?.promotionUnitPrice?.amount;

          return {
            id: this.getId(product.id),
            name: product.name,
            price: promotionalPrice || product.currentSaleUnitPrice.price.amount,
            image: product.thumbnail,
            supermarket: Waitrose.NAME,
            specialOffer: product.promotion
              ? {
                  offerText: product.promotion.promotionDescription,
                  validUntil: new Date(product.promotion.promotionExpiryDate).toISOString(),
                  originalPrice: product.currentSaleUnitPrice.price.amount,
                }
              : null,
          };
        }),
    };
  }
}

function transformSingleResult(id: string, result: SingleResult['products'][0]): Product {
  const promotionalPrice = result.promotion?.promotionUnitPrice?.amount;

  const defaultPrice = result.currentSaleUnitPrice.price.amount;

  return {
    id,
    name: result.name,
    price: promotionalPrice || defaultPrice,
    supermarket: Waitrose.NAME,
    specialOffer: result.promotion
      ? {
          offerText: result.promotion.promotionDescription,
          validUntil: new Date(result.promotion.promotionExpiryDate).toISOString(),
          originalPrice: defaultPrice,
        }
      : null,
    ...getPrice(result),
  };
}

function getPrice(result: SingleResult['products'][0]): { pricePerUnit: number; unitAmount: number; unitName: string } {
  if (result.displayPriceQualifier) {
    const match = result.displayPriceQualifier.match(/\((£?[\d.]+|[\d.]+p)\/(.*)\)/i);
    const innerMatch = match?.[2].match(/^(\d*)([^\d].*)$/);
    if (match && innerMatch) {
      const [, unitAmountString, unitName] = innerMatch;
      const unitAmount = parseFloat(unitAmountString?.trim() || '') || 1;
      const pricePerUnit =
        match[1][0] === '£' ? parseFloat(match[1].slice(1)) : parseFloat(match[1].slice(0, -1)) / 100;

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
