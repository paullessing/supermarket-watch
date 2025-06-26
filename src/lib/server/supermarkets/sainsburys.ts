import axios from 'axios';
import { isBefore } from 'date-fns';
import { Config } from '../config';
import {
  type SpecialOffer,
  SupermarketProduct,
} from '../supermarket-product.model';
import * as SainsburysModels from './sainsburys-search-results.model';
import {
  type SearchResultItemWithoutTracking,
  type SearchResultWithoutTracking,
  Supermarket,
} from './supermarket';

export class Sainsburys extends Supermarket {
  public static readonly NAME = "Sainsbury's";

  constructor(private readonly config: Config) {
    super();
    console.log('Using Sainsburys API at ' + config.sainsburysUrl);
  }

  public getPrefix(): string {
    return 'sainsburys';
  }

  public async getProduct(
    productUid: string
  ): Promise<SupermarketProduct | null> {
    const search = await axios.get<SainsburysModels.SearchResults>(
      `${this.config.sainsburysUrl}product?uids=${productUid}`
    );

    if (!search.data.products || !search.data.products.length) {
      console.debug('No products found in search');
      return null;
    }

    const product = search.data.products[0];

    // console.log(JSON.stringify(product, null, 2));

    const { price, pricePerUnit, specialOffer, packSize } =
      this.getPriceData(product);

    return SupermarketProduct({
      id: this.getId(productUid),
      name: product.name,
      image: product.image,
      url: product.full_url,

      price,
      unitAmount: product.unit_price.measure_amount,
      unitName: product.unit_price.measure,
      pricePerUnit,
      packSize,

      specialOffer,

      supermarket: Sainsburys.NAME,
    });
  }

  public async search(term: string): Promise<SearchResultWithoutTracking> {
    const params = new URLSearchParams({
      'filter[keyword]': term,
      page_size: '' + this.config.searchResultCount,
    }).toString();

    const url = `${this.config.sainsburysUrl}product?${params}`;
    const search = await axios.get<SainsburysModels.SearchResults>(url);

    const results = search.data.products;

    if (!results.length) {
      return { items: [] };
    }

    const items = results.map((product): SearchResultItemWithoutTracking => {
      const { price, specialOffer } = this.getPriceData(product);

      return {
        id: this.getId(product.product_uid),
        name: product.name,
        image: product.image,
        price,
        specialOffer: specialOffer
          ? {
              offerText: specialOffer.offerText,
              validUntil: specialOffer.validUntil,
              originalPrice: specialOffer.originalPrice,
            }
          : null,
        supermarket: Sainsburys.NAME,
      };
    });

    return {
      items,
    };
  }

  private getPriceData(product: SainsburysModels.SearchResult): {
    price: number;
    pricePerUnit: number;
    specialOffer: SpecialOffer | null;
    packSize: { amount: number; unit: string };
  } {
    // console.log("Sainsbury's Product", product, '\n\n\n\n\n');

    const promo = product.promotions.find(
      (promotion) => promotion.original_price > product.retail_price.price
    );
    const isPromoActive =
      promo?.start_date && isBefore(new Date(promo.start_date), new Date());

    const price =
      !promo || isPromoActive
        ? product.retail_price.price
        : promo.original_price;

    const pricePerUnit = product.unit_price.price;
    const packSize = {
      amount: this.formatPackSizeAmount(
        (price / pricePerUnit) * product.unit_price.measure_amount
      ),
      unit: product.unit_price.measure,
    };

    const specialOffer = isPromoActive
      ? {
          offerText: this.formatStrapline(promo.strap_line),
          originalPrice: promo.original_price,
          originalPricePerUnit: pricePerUnit * (promo.original_price / price),
          validUntil: promo.end_date,
        }
      : null;

    return {
      price,
      pricePerUnit,
      specialOffer,
      packSize,
    };
  }

  private formatPackSizeAmount(packSizeAmount: number): number {
    if (packSizeAmount < 1) {
      // Numbers < 1 are probably something like 0.175kg so give it three decimal points of accuracy
      return +packSizeAmount.toFixed(3);
    } else if (packSizeAmount < 10) {
      // Below 10, allow a single decimal point e.g. 4.5g
      return +packSizeAmount.toFixed(1);
    } else if (packSizeAmount < 100) {
      // Up to 100, round to the nearest integer e.g. 73g
      return Math.round(packSizeAmount);
    } else if (packSizeAmount < 200) {
      // Between 100-200, round to the nearest multiple of 5 so we can get e.g. 175g
      return Math.round(packSizeAmount / 5) * 5;
    } else {
      // Beyond 200, assume it's meant to be a multiple of 10
      return Math.round(packSizeAmount / 10) * 10;
    }
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
