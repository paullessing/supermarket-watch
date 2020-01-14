import axios from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import * as cheerio from 'cheerio';
import * as qs from 'querystring';
import { config } from '../config.service';
import { Product } from '../models/product.model';
import { SearchResult, SearchResultItem } from '../models/search-result.model';
import { Supermarket } from './supermarket';

axiosCookieJarSupport(axios);

export class Sainsburys extends Supermarket {

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
      langId: 44,
      storeId: 10151,
      searchType: 2,
      pageSize: config.searchResultCount,
      searchTerm: term,
    });

    const url = `https://www.sainsburys.co.uk/shop/gb/SearchDisplay?${params}`;
    const search = await axios.get(url, {
      jar: true,
      withCredentials: true,
    });

    const $ = cheerio.load(search.data);

    const hasResult = $('#productsContainer').length > 0;

    if (!hasResult) {
      return { items: [] };
    }

    const items: SearchResultItem[] = [];

    $('#productsContainer .productLister .product')
      .each((i, element) => {
        const link = $('.productNameAndPromotions h3 a', element);
        const name = link.text().trim();
        const image = getImageUrl($('.productNameAndPromotions img', element).attr('src')!);
        const url = link.attr('href'); // https://www.sainsburys.co.uk/shop/gb/groceries/andrex-toilet-tissue--classic-white-16x241-sheets
        const urlMatch = url!.match(/\/([^/]*$)/i);
        const id = urlMatch && `${this.getPrefix()}:${urlMatch[1]}` || '';
        const priceText = $('.pricePerUnit', element).text().trim();
        const isPence = priceText.indexOf('£') < 0;
        const priceValue = parseFloat(priceText.replace(/[^\d.]+/g, ''));
        const price = priceValue && (priceValue / (isPence ? 100 : 1));

        if (id) {
          items.push({
            id,
            name,
            image,
            price,
            supermarket: 'Sainsbury\'s',
          });
        }
      });

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
