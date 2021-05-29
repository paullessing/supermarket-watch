import { Injectable } from '@nestjs/common';
import { Product, SearchResult, SearchResultItem } from '@shoppi/api-interfaces';
import axios from 'axios';
import * as qs from 'querystring';
import { Config } from '../config';
import { Supermarket } from './supermarket';
import { Sainsburys as SainsburysData } from './sainsburys-search-results.model';
import SearchResults = SainsburysData.SearchResults;

@Injectable()
export class Sainsburys extends Supermarket {

  public static readonly NAME = 'Sainsbury\'s';

  constructor(private config: Config) {
    super();
  }

  public getPrefix(): string {
    return 'sainsburys';
  }

  public async getProduct(productUid: string): Promise<Product | null> {

    const search = await axios.get<SearchResults>(`https://www.sainsburys.co.uk/groceries-api/gol-services/product/v1/product?uids=${productUid}`);

    if (!search.data.products || !search.data.products.length) {
      return null;
    }

    const product = search.data.products[0];

    const promo = product.promotions.find((promotion) => promotion.original_price > product.retail_price.price);

    return {
      id: this.getId(productUid),
      name: product.name,
      price: product.retail_price.price,
      unitAmount: product.unit_price.measure_amount,
      unitName: product.unit_price.measure,
      pricePerUnit: product.unit_price.price,
      specialOffer: promo ? {
        offerText: promo.strap_line,
        originalPrice: promo.original_price,
        validUntil: promo.end_date,
      } : null,
      supermarket: Sainsburys.NAME,
    };
  }

  public async search(term: string): Promise<SearchResult> {
    const params = qs.stringify({
      'filter[keyword]': term,
      page_size: this.config.searchResultCount,
    });

    const url = `https://www.sainsburys.co.uk/groceries-api/gol-services/product/v1/product?${params}`;
    const search = await axios.get(url);

    const results = search.data.products;

    if (!results.length) {
      return { items: [] };
    }

    const items: SearchResultItem[] = results.map((result) => {
      const promo = result.promotions.find((promotion) => promotion.original_price > result.retail_price.price);

      return {
        id: this.getId(result.product_uid),
        name: result.name,
        image: result.image,
        price: result.retail_price.price,
        specialOffer: promo ? {
          offerText: promo.strap_line,
          originalPrice: promo.original_price,
          validUntil: promo.end_date,
        } : null,
        supermarket: Sainsburys.NAME,
      };
    });

    return {
      items
    };
  }
}
