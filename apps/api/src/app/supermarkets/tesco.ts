import { Injectable } from '@nestjs/common';
import { Product, SearchResult, SearchResultItem } from '@shoppi/api-interfaces';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as qs from 'querystring';
import { Config } from '../config';
import { Supermarket } from './supermarket';
import { Tesco as TescoInterface } from './tesco-product.model';
import ProductDetails = TescoInterface.ProductDetails;

@Injectable()
export class Tesco extends Supermarket {

  public static readonly NAME = 'Tesco';

  constructor(private config: Config) {
    super();
    console.log('Using Tesco API at ' + config.tescoUrl);
  }

  public getPrefix(): string {
    return 'tesco';
  }

  public async getProduct(productId: string): Promise<Product | null> {
    const search = await axios.get(`${this.config.tescoUrl}product/${productId}`);

    const $ = cheerio.load(search.data);
    const reduxState = $('body').data('reduxState');

    const { product, promotions }: ProductDetails = reduxState.productDetails.item;

    const [, unitAmountString, unitName] = product.unitOfMeasure.match(/^(\d*)([^\d].*)$/);

    const result: Product = {
      id: this.getId(product.id),
      name: product.title,
      price: product.price,
      supermarket: Tesco.NAME,
      unitAmount: parseFloat(unitAmountString?.trim() || '') || 1,
      unitName: unitName.trim(),
      pricePerUnit: product.unitPrice,
      isSpecialOffer: false,
    };

    const promotionalPrice = this.getPromotionalPrice(promotions);

    if (promotionalPrice !== null) {
      const originalPrice = product.price;
      result.price = promotionalPrice;
      result.pricePerUnit = parseFloat((product.unitPrice * promotionalPrice / originalPrice).toFixed(2));
      result.isSpecialOffer = true;
    }

    return result;
  }

  public async search(term: string): Promise<SearchResult> {
    const params = qs.stringify({
      query: term,
      offset: 0,
      limit: this.config.searchResultCount,
    });

    const url = `${this.config.tescoUrl}search?${params}`;

    const search = await axios.get(url);

    const $ = cheerio.load(search.data);
    const reduxState = $('#data-attributes').data('reduxState');

    const results = [];
    reduxState.results.pages[0].serializedData.forEach(([id, data]: [string, ProductDetails]) => {
      console.log("ID " + id + ', data:', data.product.title)

      const { product, promotions } = data;

      const result: SearchResultItem = {
        id: this.getId(id),
        name: product.title,
        image: product.defaultImageUrl,
        price: product.price,
        isSpecialOffer: false,
        supermarket: Tesco.NAME,
      };

      const promotionalPrice = this.getPromotionalPrice(promotions);

      if (promotionalPrice !== null) {
        result.price = promotionalPrice;
        result.isSpecialOffer = true;
      }

      results.push(result);
    });

    return {
      items: results,
    };
  }

  private getPromotionalPrice(promotions: ProductDetails['promotions']): null | number {
    const promotion = promotions.find(({ attributes }) => attributes.indexOf('CLUBCARD_PRICING') >= 0);

    if (promotion) {
      const match = promotion.offerText.match(/^£(\d+\.\d{2}) /);
      if (match) {
        return parseFloat(match[1]);
      }
    }

    return null;
  }
}
