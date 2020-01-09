import { Product } from './models/product.model';
import { SearchResultItem } from './models/search-result.model';
import { Sainsburys } from './supermarkets/sainsburys';
import { Supermarket } from './supermarkets/supermarket';
import { Tesco } from './supermarkets/tesco';
import { Waitrose } from './supermarkets/waitrose';

export class SupermarketService {
  private supermarkets: Supermarket[];

  constructor() {
    this.supermarkets = [
      new Waitrose(),
      new Sainsburys(),
      new Tesco(),
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

  public getSingleItem(id: string): Promise<Product|null> {
    for (const supermarket of this.supermarkets) {
      const prefix = supermarket.getPrefix();
      if (id.indexOf(prefix) === 0) {
        return supermarket.getProduct(id);
      }
    }
    return Promise.resolve(null);
  }
}
