import { Injectable } from '@nestjs/common';
import { Product, SearchResult, SearchResultItem } from '@shoppi/api-interfaces';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as qs from 'querystring';
import { Config } from '../config.service';
import { Supermarket } from './supermarket';

@Injectable()
export class Tesco extends Supermarket {

  public static readonly NAME = 'Tesco';

  constructor(private config: Config) {
    super();
  }

  public getPrefix(): string {
    return 'tesco';
  }

  public async getProduct(productId: string): Promise<Product | null> {
    const search = await axios.get(`https://www.tesco.com/groceries/en-GB/products/${productId}`);

    const $ = cheerio.load(search.data);

    const hasResult = $('.product-details-tile').length > 0;
    if (!hasResult) {
      return null;
    }

    const name = $('.product-details-tile__title').text();
    const price = parseFloat($('.price-per-sellable-unit [data-auto="price-value"]').text().replace(/[^\d.]+/g, ''));
    const pricePerMeasureMatch = $('.price-per-quantity-weight [data-auto="price-value"]').text().match(/([\d.]+)/);
    const pricePerMeasure = pricePerMeasureMatch ? parseFloat(pricePerMeasureMatch[1]) : -1;
    const measure = ($('.price-per-quantity-weight .weight').html() ||'').replace(/^\//, ''); // Use HTML because for some reason cheerio doesn't seem to like `<span>/litre</span>` and returns `/litre/litre`

    return {
      name,
      price,
      supermarket: Tesco.NAME,
      unitName: measure,
      pricePerUnit: pricePerMeasure,
      isPence: false
    };
  }

  public async search(term: string): Promise<SearchResult> {
    if (!this.config.tescoApiKey) {
      return {
        items: []
      };
    }

    const params = qs.stringify({
      query: term,
      offset: 0,
      limit: this.config.searchResultCount,
    });

    const url = `https://dev.tescolabs.com/grocery/products/?${params}`;

    const search = await axios.get(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': this.config.tescoApiKey
      }
    });

    const results = search.data.uk.ghs.products.results;

    if (results.length === 0) {
      return { items: [] };
    }

    const items: SearchResultItem[] = results.map(({ id, name, image, price }: any) => ({
      id: `${this.getPrefix()}:${id}`,
      name,
      image,
      price,
      supermarket: 'Tesco',
    }));

    return {
      items
    };
  }
}
