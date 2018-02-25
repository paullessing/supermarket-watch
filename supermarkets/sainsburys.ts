import { Supermarket } from './supermarket';
import * as request from 'request-promise';
import { Product } from '../models/product.model';
import * as cheerio from 'cheerio';
import { SearchResult, SearchResultItem } from '../models/search-result.model';
import * as qs from 'querystring';

export class Sainsburys extends Supermarket {

  public async getProduct(productLink: string): Promise<Product | null> {
    const search = await request({ url: `https://www.sainsburys.co.uk/shop/gb/groceries/${productLink}`, jar: request.jar()}); // Need to pretend we want cookies, else the server refuses to serve us

    const $ = cheerio.load(search);

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
    const params = { catalogId: [ '10123', '10123' ],
      langId: '44',
      storeId: '10151',
      categoryId: '',
      parent_category_rn: '',
      top_category: '',
      pageSize: '36',
      orderBy: '',
      searchTerm: term,
      beginIndex: '0',
      categoryFacetId1: ''
    };
    const query = qs.stringify(params);

    const url = `https://www.sainsburys.co.uk/webapp/wcs/stores/servlet/SearchDisplayView?${query}`;
    const search = await request({ url, jar: request.jar() });

    const $ = cheerio.load(search);

    const hasResult = $('#productsContainer').length > 0;

    if (!hasResult) {
      return { items: [] };
    }

    const items: SearchResultItem[] = [];

    $('#productsContainer .productLister .product')
      .each((i, element) => {
        const link = $('.productNameAndPromotions h3 a', element);
        const name = link.text().trim();
        const image = getImageUrl($('.productNameAndPromotions img', element).attr('src'));
        const url = link.attr('href'); // https://www.sainsburys.co.uk/shop/gb/groceries/andrex-toilet-tissue--classic-white-16x241-sheets
        const urlMatch = url.match(/\/([^/]*$)/i);
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
