import { Injectable } from '@nestjs/common';
import { Product, SearchResult, SearchResultItem } from '@shoppi/api-interfaces';
import axios from 'axios';
import * as qs from 'querystring';
import { Config } from '../config';
import { Supermarket } from './supermarket';

type PriceInPounds = number;

interface SainsburysSearchResults {
  products: SainsburysSearchResult[];
}

interface SainsburysSearchResult {
  product_uid: string;
  favourite_uid: unknown;
  product_type: 'BASIC' | unknown;
  name: string;
  image: string; // size: L
  image_zoom: unknown;
  image_thumbnail: string; // size: M
  image_thumbnail_small: string; // size: S
  full_url: string; // product web URL
  unit_price: {
    price: PriceInPounds;
    measure: 'ltr' | string;
    measure_amount: number
  };
  retail_price: {
    price: PriceInPounds;
    measure: 'unit' | string;
  };
  is_available: boolean;
  promotions: unknown[];
  associations: unknown[];
  is_alcoholic: boolean;
  is_spotlight: boolean;
  is_intolerant: boolean;
  is_mhra: boolean;
  badges: unknown[];
  labels: unknown[];
  zone: unknown;
  department: unknown;
  reviews: {
    is_enabled: boolean;
    product_uid: string; // same as top
    total: number;
    average_rating: number; // 1-5
  };
  breadcrumbs: {
    label: string;
    url: string; // relative to root
  }[];
  'details_html'?: string; // base64 encoded HTML
  assets: {
    plp_image: string;
    images: {
      id: string; // e.g. '1'
      sizes: {
        width: number; // px
        height: number; // px
        url: string;
      }[];
    }[];
    video: unknown[]
  };
  description: string[]; // e.g. 'Almond drink with added calcium and vitamins.'
  important_information: string[];
  attachments: unknown[];
  categories: {
    id: string; // category ID e.g. '428940'
    name: string; // category name e.g. 'All dairy free'
  }[];
  display_icons: unknown[];
  pdp_deep_link: '/shop/ProductDisplay?storeId=10151&langId=44&productId=34260'
}

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

    const search = await axios.get<SainsburysSearchResults>(`https://www.sainsburys.co.uk/groceries-api/gol-services/product/v1/product?uids=${productUid}`);

    if (!search.data.products || !search.data.products.length) {
      return null;
    }

    const product = search.data.products[0];

    return {
      id: this.getId(productUid),
      name: product.name,
      supermarket: Sainsburys.NAME,
      price: product.retail_price.price,
      unitAmount: product.unit_price.measure_amount,
      unitName: product.unit_price.measure,
      pricePerUnit: product.unit_price.price,
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

    const items: SearchResultItem[] = results.map((result) => ({
      id: this.getId(result.product_uid),
      name: result.name,
      image: result.image,
      price: result.retail_price.price,
      supermarket: 'Sainsbury\'s',
    }));

    return {
      items
    };
  }
}
