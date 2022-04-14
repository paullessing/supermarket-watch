import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { standardiseUnit } from '@shoppi/api-interfaces';
import { Config } from '../config';
import { SearchResultItemWithoutTracking, SearchResultWithoutTracking, Supermarket } from './supermarket';
import { SupermarketProduct } from './supermarket-product.model';
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

  public async getProduct(id: string): Promise<SupermarketProduct | null> {
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

      // console.log(JSON.stringify(result, null, 2));

      return transformSingleResult(this.getId(id), result);
    }
  }

  public async search(term: string): Promise<SearchResultWithoutTracking> {
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
        .map(({ searchProduct: product }): SearchResultItemWithoutTracking => {
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

function transformSingleResult(id: string, result: SingleResult['products'][0]): SupermarketProduct {
  const promotionalPrice = result.promotion?.promotionUnitPrice?.amount;

  const defaultPrice = result.currentSaleUnitPrice.price.amount;

  const { pricePerUnit, unitAmount, unitName } = getPrice(result);

  const price = promotionalPrice || defaultPrice;

  // TODO figure out how to compute promotional price

  return SupermarketProduct({
    id,
    name: result.name,
    image:
      result.productImageUrls.extraLarge ||
      result.productImageUrls.large ||
      result.productImageUrls.medium ||
      result.thumbnail,
    url: `https://www.waitrose.com/ecom/products/_/${result.id}`, // _ is a slug and not relevant, so we use something arbitrary

    price,
    pricePerUnit,
    unitAmount,
    unitName,
    packSize: parsePackSize(result.size),

    specialOffer: result.promotion
      ? {
          offerText: result.promotion.promotionDescription,
          validUntil: new Date(result.promotion.promotionExpiryDate).toISOString(),
          originalPrice: defaultPrice,
          originalPricePerUnit: result.currentSaleUnitPrice.price.amount,
        }
      : null,

    supermarket: Waitrose.NAME,
  });
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

function parsePackSize(sizeString: string): { amount: number; unit: string } {
  const match = sizeString.match(/^(\d*)([^\d].*)$/);
  if (match) {
    const [, amountString, unit] = match;
    const amount = parseFloat(amountString?.trim() || '') || 1;

    return {
      amount,
      unit: standardiseUnit(unit.trim()),
    };
  }

  console.error('Could not parse size', sizeString);

  return {
    amount: 1,
    unit: '',
  };
}
