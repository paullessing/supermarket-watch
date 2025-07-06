import axios, { isAxiosError } from 'axios';
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
import type {
  ApolloCache,
  ProductType,
  PromotionType,
} from '$lib/server/supermarkets/tesco-search.model';

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
    try {
      // TODO retry this if it fails, sometimes it works on the second try
      const $ = await this.fetchSingleProductPage(productId);

      const rawState = $('script[type="application/discover+json"]')?.html();
      if (!rawState) {
        throw new Error('No raw state found in Tesco page');
      }
      const state = JSON.parse(rawState);

      const apollo = state?.['mfe-orchestrator']?.props?.apolloCache;
      const product = apollo?.['ProductType:' + productId];

      if (!product) {
        throw new Error('No product found in Tesco page');
      }

      return this.parseSingleProductData(product, apollo);
    } catch (e) {
      console.error(e);
      throw new Error('Failed to parse Tesco state');
    }
  }

  private async fetchSingleProductPage(
    productId: string
  ): Promise<cheerio.CheerioAPI> {
    try {
      const search = await axios.get(
        `${this.config.tescoUrl}product/${productId}`
      );

      return cheerio.load(search.data);
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 404) {
        console.error(
          `Got a 404 while fetching tesco product "${productId}":`,
          e.message
        );
        throw new Error('NOT_FOUND'); // TODO make a separate error here
      } else {
        throw e;
      }
    }
  }

  private parseSingleProductData(
    product: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    apollo: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): SupermarketProduct {
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
      id: this.getId(product.id),
      name: product.title,
      image: product.defaultImageUrl,
      url: `https://www.tesco.com/groceries/en-GB/products/${product.id}`,
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
      const search = (await axios.get<string>(url)).data;
      // const search = getTempTescoSearchData();

      // console.log('Tesco search', search);

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
    searchPageHtml: string
  ): SearchResultItemWithoutTracking[] {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const $ = cheerio.load(searchPageHtml);

    const data = JSON.parse(
      $('script[type="application/discover+json"]').html() ?? ''
    );

    // console.log(data);
    const apolloCache: ApolloCache = data['mfe-orchestrator'].props.apolloCache;

    const searchKey = Object.keys(apolloCache.ROOT_QUERY).find((key) =>
      key.match(/^search\b/)
    );
    if (!searchKey) {
      console.warn('No search data found in result data from Tesco');
      return [];
    }

    const resultKeys = apolloCache.ROOT_QUERY[
      searchKey as 'search(stringTODO)'
    ].results
      .filter((result: any) => result.__typename === 'CompositeResultType')
      .map((result: any): string => result.node.__ref);

    const resultObjects = resultKeys.map(
      (key: string) => apolloCache[key as keyof ApolloCache] as ProductType
    );

    const results = resultObjects.map(
      (resultObject): SearchResultItemWithoutTracking => {
        const result: SearchResultItemWithoutTracking = {
          id: this.getId(resultObject.id),
          name: resultObject.title,
          image: resultObject.defaultImageUrl,
          price: resultObject.price.actual,
          specialOffer: null,
          supermarket: Tesco.NAME,
        };

        if (resultObject.promotions) {
          const promotions = resultObject.promotions.map(
            (promoData: any) =>
              apolloCache[
                promoData?.__ref as keyof ApolloCache
              ] as PromotionType
          );
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
        }

        return result;
      }
    );

    return results;
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  private getPromotion(
    promotions: ProductDetails['promotions'] | PromotionType[]
  ): null | { price: number; offerText: string; endDate: string } {
    function isSearchPromotion(
      promotion: PromotionType | Record<string, unknown>
    ): promotion is PromotionType {
      return (promotion as PromotionType).__typename === 'PromotionType';
    }

    const promotion = promotions.find(
      ({ attributes }) => attributes.indexOf('CLUBCARD_PRICING') >= 0
    );

    if (promotion) {
      const match = isSearchPromotion(promotion)
        ? promotion.description.match(/^Â?£(\d+\.\d{2}) (.*)$/)
        : promotion.offerText.match(/^£(\d+\.\d{2}) (.*)$/);
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
