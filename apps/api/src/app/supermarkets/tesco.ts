import * as qs from 'querystring';
import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { Config } from '../config';
import { Product } from '../product.model';
import { SearchResultItemWithoutTracking, SearchResultWithoutTracking, Supermarket } from './supermarket';
import { ProductDetails } from './tesco-product.model';

@Injectable()
export class Tesco extends Supermarket {
  public static readonly NAME = 'Tesco';

  constructor(private readonly config: Config) {
    super();
    console.log('Using Tesco API at ' + config.tescoUrl);
  }

  public getPrefix(): string {
    return 'tesco';
  }

  public async getProduct(productId: string): Promise<Product | null> {
    const search = await axios.get(`${this.config.tescoUrl}product/${productId}`);

    const $ = cheerio.load(search.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reduxState = $('body').data('reduxState') as any;

    const { product, promotions }: ProductDetails = reduxState.productDetails.item;

    const unitOfMeasure = product.unitOfMeasure.match(/^(\d*)([^\d].*)$/);
    if (!unitOfMeasure) {
      throw new Error('Could not parse unit of measure');
    }
    const [, unitAmountString, unitName] = unitOfMeasure;

    const result: Product = {
      id: this.getId(product.id),
      name: product.title,
      price: product.price,
      supermarket: Tesco.NAME,
      unitAmount: parseFloat(unitAmountString?.trim() || '') || 1,
      unitName: unitName.trim(),
      pricePerUnit: product.unitPrice,
      specialOffer: null,
    };

    const promotion = this.getPromotion(promotions);

    if (promotion) {
      const originalPrice = product.price;
      result.price = promotion.price;
      result.pricePerUnit = parseFloat(((product.unitPrice * promotion.price) / originalPrice).toFixed(2));
      result.specialOffer = {
        originalPrice,
        offerText: promotion.offerText,
        validUntil: promotion.endDate,
      };
    }

    return result;
  }

  public async search(term: string): Promise<SearchResultWithoutTracking> {
    const params = qs.stringify({
      query: term,
      offset: 0,
      limit: this.config.searchResultCount,
    });

    const url = `${this.config.tescoUrl}search?${params}`;

    try {
      const search = await axios.get(url);

      return {
        items: this.extractSearchResults(search),
      };
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        // No results for this search term
        console.info(`Tesco: Search query "${term}" returned no results`);
        return {
          items: [],
        };
      }
      throw e;
    }
  }

  private extractSearchResults(search: AxiosResponse<string>): SearchResultItemWithoutTracking[] {
    const $ = cheerio.load(search.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reduxState = $('#data-attributes').data('reduxState') as any;

    const results: SearchResultItemWithoutTracking[] = [];
    reduxState.results.pages[0].serializedData.forEach(([id, data]: [string, ProductDetails]) => {
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
    });

    return results;
  }

  private getPromotion(
    promotions: ProductDetails['promotions']
  ): null | { price: number; offerText: string; endDate: string } {
    const promotion = promotions.find(({ attributes }) => attributes.indexOf('CLUBCARD_PRICING') >= 0);

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
}
