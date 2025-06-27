import axios, { type AxiosResponse, isAxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { Config } from '../config';
import { SupermarketProduct } from '../supermarket-product.model';
import {
  type SearchResultItemWithoutTracking,
  type SearchResultWithoutTracking,
  Supermarket,
} from './supermarket';
import type { ProductDetails } from './tesco-product.model';
import { standardiseUnit } from '$lib/models';

export class Tesco extends Supermarket {
  public static readonly NAME = 'Tesco';

  constructor(private readonly config: Config) {
    super();
    console.log('Using Tesco API at ' + config.tescoUrl);
  }

  public getPrefix(): string {
    return 'tesco';
  }

  public async getProduct(
    productId: string
  ): Promise<SupermarketProduct | null> {
    let search: AxiosResponse;

    try {
      search = await axios.get(`${this.config.tescoUrl}product/${productId}`);
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 404) {
        console.error(
          `Got a 404 while fetching tesco product "${productId}":`,
          e.message
        );
        return null;
      } else {
        throw e;
      }
    }

    const $ = cheerio.load(search.data);

    // TODO type these, mabye
    let product;
    let apollo;

    try {
      const rawState = $('script[type="application/discover+json"]').html();
      if (!rawState) {
        throw new Error('No raw state found in Tesco page');
      }
      const state = JSON.parse(rawState);

      apollo = state['mfe-orchestrator']['props']['apolloCache'];
      product = apollo['ProductType:' + productId];
    } catch (e) {
      console.error(e);
      throw new Error('Failed to parse Tesco state');
    }

    const unitOfMeasure = product.price.unitOfMeasure.match(/^(\d*)([^\d].*)$/);
    if (!unitOfMeasure) {
      throw new Error('Could not parse unit of measure');
    }
    const [, unitAmountString, unitName] = unitOfMeasure;

    const promotion = this.getApolloPromotion(product, apollo);

    let specialOffer: Pick<SupermarketProduct, 'specialOffer'> &
      Partial<SupermarketProduct> = { specialOffer: null };

    if (promotion) {
      const originalPrice = product.price;

      specialOffer = {
        price: promotion.price,
        pricePerUnit: parseFloat(
          (promotion.price * (product.unitPrice / originalPrice)).toFixed(2)
        ),
        specialOffer: {
          originalPrice,
          offerText: promotion.offerText,
          validUntil: promotion.endDate,
          originalPricePerUnit: product.unitPrice,
        },
      };
    }

    const packSize = product.details.packSize[0];

    console.log(product);

    return SupermarketProduct({
      id: this.getId(productId),
      name: product.title,
      image: product.defaultImageUrl,
      url: `https://www.tesco.com/groceries/en-GB/products/${productId}`,
      price: product.price.actual,
      packSize: {
        amount: parseFloat(packSize.value || '') || 1,
        unit: standardiseUnit(packSize.units),
      },

      supermarket: Tesco.NAME,
      unitAmount: parseFloat(unitAmountString?.trim() || '') || 1,
      unitName: unitName.trim(),
      pricePerUnit: product.price.unitPrice,

      ...specialOffer,
    });
  }

  public async search(term: string): Promise<SearchResultWithoutTracking> {
    const params = new URLSearchParams({
      query: term,
      offset: '0',
      limit: this.config.searchResultCount.toString(),
    }).toString();

    const url = `${this.config.tescoUrl}search?${params}`;
    console.log('Tesco: searching', url);

    try {
      const search = await axios.get(url);

      console.log('Tesco search', search);

      return {
        items: this.extractSearchResults(search),
      };
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 404) {
        // No results for this search term
        console.info(`Tesco: Search query "${term}" returned no results`);
        return {
          items: [],
        };
      }
      throw e;
    }
  }

  private extractSearchResults(
    search: AxiosResponse<string>
  ): SearchResultItemWithoutTracking[] {
    const $ = cheerio.load(search.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reduxState = $('#data-attributes').data('reduxState') as any;

    console.log('Tesco', reduxState);

    const results: SearchResultItemWithoutTracking[] = [];
    reduxState.results.pages[0].serializedData.forEach(
      ([id, data]: [string, ProductDetails]) => {
        const { product, promotions } = data;

        const result: SearchResultItemWithoutTracking = {
          id: this.getId(id),
          name: product.title,
          image: product.defaultImageUrl,
          price: product.price,
          specialOffer: null,
          supermarket: Tesco.NAME,
        };

        const promotion = this.getPromotion(promotions);

        if (promotion) {
          const originalPrice = result.price;
          result.price = promotion.price;
          result.specialOffer = {
            originalPrice,
            offerText: promotion.offerText,
            validUntil: promotion.endDate,
          };
        }

        results.push(result);
      }
    );

    return results;
  }

  private getPromotion(
    promotions: ProductDetails['promotions']
  ): null | { price: number; offerText: string; endDate: string } {
    const promotion = promotions.find(
      ({ attributes }) => attributes.indexOf('CLUBCARD_PRICING') >= 0
    );

    if (promotion) {
      const match = promotion.offerText.match(/^£(\d+\.\d{2}) (.*)$/);
      if (match) {
        return {
          price: parseFloat(match[1]),
          offerText: match[2],
          endDate: promotion.endDate,
        };
      }
    }

    return null;
  }

  private getApolloPromotion(
    product: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    apolloCache: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): null | {
    price: number;
    offerText: string;
    endDate: string;
  } {
    if (!product.promotions?.length) {
      return null;
    }

    const promotion = product.promotions
      .map(({ __ref }: { __ref: string }) => apolloCache[__ref])
      .filter(Boolean)
      .filter(({ attributes }: { attributes: string[] }) =>
        attributes.includes('CLUBCARD_PRICING')
      )[0];

    if (promotion) {
      const match = promotion.description.match(/^£(\d+\.\d{2}) (.*)$/);
      if (match) {
        return {
          price: parseFloat(match[1]),
          offerText: match[2],
          endDate: promotion.endDate,
        };
      }
    }

    return null;
  }
}
