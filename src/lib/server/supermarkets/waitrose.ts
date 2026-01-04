import axios from 'axios';
import * as cheerio from 'cheerio';
import { Config } from '../config';
import {
  type SpecialOffer,
  SupermarketProduct,
} from '../supermarket-product.model';
import {
  type SearchResultItemWithoutTracking,
  type SearchResultWithoutTracking,
  Supermarket,
} from './supermarket';
import {
  isProduct,
  type SearchResults,
  type SingleResult,
} from './waitrose-search.model';
import { standardiseUnit } from '$lib/models';

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
    console.log('Using Waitrose API at ' + config.waitroseUrl);
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

    const response = await axios.get<string>(
      `${this.config.waitroseUrl}ecom/products/name/${id}`
    );

    const $: cheerio.CheerioAPI = cheerio.load(response.data);

    const script = $('script#__NEXT_DATA__').text();
    if (!script) {
      return null;
    }

    try {
      const data = JSON.parse(script);
      console.log(JSON.stringify(data?.props?.pageProps?.product, null, 2));
      return transformSingleResult(id, data?.props?.pageProps?.product);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  public async search(term: string): Promise<SearchResultWithoutTracking> {
    await this.init();

    const url = `${this.config.waitroseUrl}api/content-prod/v2/cms/publish/productcontent/search/${this.customerId}?clientType=WEB_APP`;
    const requestBody = {
      customerSearchRequest: {
        queryParams: {
          size: Math.min(this.config.searchResultCount, 80),
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
          const promotionalPrice =
            product.promotion?.promotionUnitPrice?.amount;

          return {
            id: this.getId(product.id),
            name: product.name,
            price:
              promotionalPrice || product.currentSaleUnitPrice.price.amount,
            image: product.thumbnail,
            supermarket: Waitrose.NAME,
            specialOffer: product.promotion
              ? {
                  offerText: product.promotion.promotionDescription,
                  validUntil: new Date(
                    product.promotion.promotionExpiryDate
                  ).toISOString(),
                  originalPrice: product.currentSaleUnitPrice.price.amount,
                }
              : null,
          };
        }),
    };
  }
}

function getSpecialOffer(
  promotion: SingleResult['products'][0]['promotions'][0],
  originalPrice: number,
  promotionalPrice: number,
  pricePerUnit: number
): SpecialOffer {
  const originalPricePerUnit =
    pricePerUnit * (originalPrice / promotionalPrice);

  return {
    offerText: promotion.promotionDescription,
    validUntil: new Date(promotion.promotionExpiryDate).toISOString(),
    originalPrice,
    originalPricePerUnit,
  };
}

function transformSingleResult(
  id: string,
  result: SingleResult['products'][0]
): SupermarketProduct {
  const promotionalPrice = result.promotions?.[0]?.promotionUnitPrice?.amount;

  const defaultPrice = result.pricing.currentSaleUnitRetailPrice.price.amount;

  const { pricePerUnit, unitAmount, unitName } = getPrice(result);
  const packSize = parsePackSize(result.size);

  const price = promotionalPrice || defaultPrice;

  const specialOffer = result.promotions?.length
    ? getSpecialOffer(result.promotions[0], defaultPrice, price, pricePerUnit)
    : null;

  return SupermarketProduct({
    id,
    name: result.name,
    image:
      result.images.extraLarge ||
      result.images.large ||
      result.images.medium ||
      result.image ||
      result.thumbnail,
    url: `https://www.waitrose.com/ecom/products/_/${result.id}`, // _ is a slug and not relevant, so we use something arbitrary

    price,
    pricePerUnit,
    unitAmount,
    unitName,
    packSize,

    specialOffer,

    supermarket: Waitrose.NAME,
  });
}

function getPrice(result: SingleResult['products'][0]): {
  pricePerUnit: number;
  unitAmount: number;
  unitName: string;
} {
  if (result.displayPriceQualifier) {
    // Format for displayPriceQualifier: "18.5p each", "£5.88/100g"
    const match = result.displayPriceQualifier.match(
      /(£?[\d.]+|[\d.]+p)[/ ](.*)\)?/i
    );
    const innerMatch = match?.[2].match(/^(\d*)([^\d].*)$/);
    if (match && innerMatch) {
      const [, unitAmountString, unitName] = innerMatch;
      const unitAmount = parseFloat(unitAmountString?.trim() || '') || 1;
      const pricePerUnit =
        match[1][0] === '£'
          ? parseFloat(match[1].slice(1))
          : parseFloat(match[1].slice(0, -1)) / 100;

      return {
        unitAmount,
        pricePerUnit,
        unitName: unitName.trim(),
      };
    }
  }

  return {
    pricePerUnit: result.pricing.currentSaleUnitRetailPrice.price.amount,
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
