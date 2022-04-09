import * as qs from 'querystring';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { isBefore } from 'date-fns';
import { Config } from '../config';
import * as SainsburysModels from './sainsburys-search-results.model';
import { SearchResultItemWithoutTracking, SearchResultWithoutTracking, Supermarket } from './supermarket';
import { SupermarketProduct } from './supermarket-product.model';

@Injectable()
export class Sainsburys extends Supermarket {
  public static readonly NAME = "Sainsbury's";

  constructor(private readonly config: Config) {
    super();
  }

  public getPrefix(): string {
    return 'sainsburys';
  }

  public async getProduct(productUid: string): Promise<SupermarketProduct | null> {
    const search = await axios.get<SainsburysModels.SearchResults>(
      `https://www.sainsburys.co.uk/groceries-api/gol-services/product/v1/product?uids=${productUid}`
    );

    if (!search.data.products || !search.data.products.length) {
      return null;
    }

    const product = search.data.products[0];

    // console.log(JSON.stringify(product, null, 2));

    const { price, specialOffer } = this.getPriceData(product);

    return SupermarketProduct({
      id: this.getId(productUid),
      name: product.name,
      image: product.image,
      url: product.full_url,

      price,
      unitAmount: product.unit_price.measure_amount,
      unitName: product.unit_price.measure,
      pricePerUnit: product.unit_price.price,
      packSize: {
        amount: Math.round((price / (product.unit_price.price * product.unit_price.measure_amount)) * 1000) / 1000,
        unit: product.unit_price.measure,
      },

      specialOffer,

      supermarket: Sainsburys.NAME,
    });
  }

  public async search(term: string): Promise<SearchResultWithoutTracking> {
    const params = qs.stringify({
      'filter[keyword]': term,
      page_size: this.config.searchResultCount,
    });

    const url = `https://www.sainsburys.co.uk/groceries-api/gol-services/product/v1/product?${params}`;
    const search = await axios.get<SainsburysModels.SearchResults>(url);

    const results = search.data.products;

    if (!results.length) {
      return { items: [] };
    }

    const items: SearchResultItemWithoutTracking[] = results.map((product) => {
      const { price, specialOffer } = this.getPriceData(product);

      return {
        id: this.getId(product.product_uid),
        name: product.name,
        image: product.image,
        price,
        specialOffer,
        supermarket: Sainsburys.NAME,
      };
    });

    return {
      items,
    };
  }

  private getPriceData(product: SainsburysModels.SearchResult): {
    price: number;
    specialOffer: SearchResultItemWithoutTracking['specialOffer'] | null;
  } {
    const promo = product.promotions.find((promotion) => promotion.original_price > product.retail_price.price);
    const isPromoActive = promo?.start_date && isBefore(new Date(promo.start_date), new Date());

    const price = !promo || isPromoActive ? product.retail_price.price : promo.original_price;
    const specialOffer = isPromoActive
      ? {
          offerText: this.formatStrapline(promo.strap_line),
          originalPrice: promo.original_price,
          validUntil: promo.end_date,
        }
      : null;

    return {
      price,
      specialOffer,
    };
  }

  private formatStrapline(strapline: string): string {
    console.debug('Strapline', JSON.stringify(strapline));

    // prettier-ignore
    const redundantStraplines = [
      /:\s+Was [£p0-9.]+ Now [£p0-9.]+/i,
      /^Only [£p0-9.]+: Save [£p0-9.]+/i
    ] as const;

    for (const redundantStrapline of redundantStraplines) {
      if (redundantStrapline.test(strapline)) {
        return strapline.replace(redundantStrapline, '').trim();
      }
    }

    return strapline;
  }
}
