import { Supermarket } from './supermarket';
import * as request from 'request-promise';
import { Product } from '../models/product.model';
import * as cheerio from 'cheerio';

export class Sainsburys extends Supermarket {

  public async getProduct(productLink: string): Promise<Product | null> {
    console.log('Requesting:', `https://www.sainsburys.co.uk/shop/gb/groceries/${productLink}`);
    const search = await request({ url: `https://www.sainsburys.co.uk/shop/gb/groceries/${productLink}`, jar: request.jar()}); // Need to pretend we want cookies, else the server refuses to serve us
    console.log('Result:', search);

    const $ = cheerio.load(search);

    const hasResult = $('.productContent').length > 0;
    if (!hasResult) {
      return null;
    }

    const price = parseFloat($('.pricePerMeasure').text().replace(/[^\d.]+/g, ''));
    const name = $('.productTitleDescriptionContainer h1').text();
    const pricePerMeasureMatch = $('.pricePerMeasure').text().match(/\d+/);
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
}
