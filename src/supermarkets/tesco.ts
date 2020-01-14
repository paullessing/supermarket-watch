import { config } from '../config.service';
import { Supermarket } from './supermarket';
import axios from 'axios';
import { Product } from '../models/product.model';
import * as cheerio from 'cheerio';
import { SearchResult, SearchResultItem } from '../models/search-result.model';
import * as qs from 'querystring';

export class Tesco extends Supermarket {

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
      unitName: measure,
      pricePerUnit: pricePerMeasure,
      isPence: false
    };
  }

  public async search(term: string): Promise<SearchResult> {
    const params = qs.stringify({
      query: term,
      offset: 0,
      limit: config.searchResultCount,
    });

    const url = `https://dev.tescolabs.com/grocery/products/?${params}`;

    const search = await axios.get(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': config.tescoApiKey
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
      price
    }));

    return {
      items
    };
  }
}
