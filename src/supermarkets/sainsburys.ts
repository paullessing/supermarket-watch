import { Supermarket } from './supermarket';
import axios from 'axios';
import { Product } from '../models/product.model';
import * as cheerio from 'cheerio';
import { SearchResult, SearchResultItem } from '../models/search-result.model';
import axiosCookieJarSupport from 'axios-cookiejar-support';

axiosCookieJarSupport(axios);

export class Sainsburys extends Supermarket {

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
    const price = parseFloat($('.pricePerUnit').text().replace(/[^\d.]+/g, ''));
    const pricePerMeasureMatch = $('.pricePerMeasure').text().match(/([\d.]+)/);
    const pricePerMeasure = pricePerMeasureMatch ? parseFloat(pricePerMeasureMatch[1]) : -1;
    const measure = $('.pricePerMeasureMeasure').text();

    return {
      name,
      price,
      unitName: measure,
      pricePerUnit: pricePerMeasure,
      isPence: false
    };
  }

  public async search(term: string): Promise<SearchResult> {
    const url = `https://www.sainsburys.co.uk/shop/gb/SearchDisplay?langId=44&storeId=10151&searchType=2&searchTerm=${encodeURIComponent(term)}`;
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
        const id = urlMatch && `sainsburys:${urlMatch[1]}` || '';
        const priceText = $('.pricePerUnit', element).text().trim();
        const price = parseFloat(priceText.replace(/[^\d.]+/g, ''));

        if (id) {
          items.push({
            id,
            name,
            image,
            price
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
