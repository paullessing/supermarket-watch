import { Inject, Injectable } from '@nestjs/common';
import { Product, SearchResultItem } from '@shoppi/api-interfaces';
import { Supermarket, Supermarkets } from './supermarket';

@Injectable()
export class SupermarketService {

  constructor(
    @Inject(Supermarkets) private readonly supermarkets: Supermarket[],
  ) {}

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
