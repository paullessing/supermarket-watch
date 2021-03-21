import axios from 'axios';
import * as cheerio from 'cheerio';
import * as qs from 'querystring';
import { Config } from '../config.service';
import { Product } from '@shoppi/api-interfaces';
import { SearchResult, SearchResultItem } from '@shoppi/api-interfaces';
import { Supermarket } from './supermarket';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Sainsburys extends Supermarket {

  constructor(private config: Config) {
    super();
  }

  public getPrefix(): string {
    return 'sainsburys';
  }

  public async getProduct(productLink: string): Promise<Product | null> {
    const search = await axios.get(`https://www.sainsburys.co.uk/shop/gb/groceries/${productLink}`, {
      jar: true,
      withCredentials: true,
    });

    const $ = cheerio.load(search.data);

    const hasResult = $('.productContent').length > 0;
    if (!hasResult) {
      return null;
    }

    const name = $('.productTitleDescriptionContainer h1').text();
    const priceText = $('.pricePerUnit').text();
    const isPence = priceText.indexOf('£') < 0;
    const priceValue = parseFloat(priceText.replace(/[^\d.]+/g, ''));
    const price = priceValue && priceValue / (isPence ? 100 : 0);
    const pricePerMeasureMatch = $('.pricePerMeasure').text().match(/([\d.]+)/);
    const pricePerMeasure = pricePerMeasureMatch ? parseFloat(pricePerMeasureMatch[1]) : -1;
    const measure = $('.pricePerMeasureMeasure').text(); // TODO this is wrong

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
      name: result.name,
      image: result.image,
      price: result.retail_price.price,
      id: result.product_uid,
      supermarket: 'Sainsbury\'s',
    }));

    return {
      items
    };
  }
}

function getImageUrl(image: string): string {
  if (image.indexOf('//') === 0) {
    return 'https:' + image;
  } else {
    return image;
  }
}
