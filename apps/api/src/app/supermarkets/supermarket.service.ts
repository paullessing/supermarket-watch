import { Product, SearchResultItem } from '@shoppi/api-interfaces';
import { Sainsburys } from './sainsburys';
import { Supermarket } from './supermarket';
import { Tesco } from './tesco';
import { Waitrose } from './waitrose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SupermarketService {
  private readonly supermarkets: Supermarket[];

  constructor(
    waitrose: Waitrose,
    sainsburys: Sainsburys,
    tesco: Tesco,
  ) {
    this.supermarkets = [
      waitrose,
      sainsburys,
      tesco,
    ];
  }

  public async search(query: string): Promise<SearchResultItem[]> {
    const resultsBySupermarket = await Promise.all(
      this.supermarkets
        .map((supermarket) => supermarket.search(query)
          .then(({ items }) => items))
    );

    const results: SearchResultItem[] = ([] as SearchResultItem[]).concat.apply([], resultsBySupermarket);

    return results;
  }

  public async getSingleItem(id: string): Promise<Product|null> {
    const match = id.match(/^(\w+)\:(.+)$/);
    if (!match) {
      return null;
    }

    for (const supermarket of this.supermarkets) {
      const prefix = supermarket.getPrefix();
      if (prefix === match[1]) {
        return supermarket.getProduct(match[2]);
      }
    }
    return null;
  }
}
