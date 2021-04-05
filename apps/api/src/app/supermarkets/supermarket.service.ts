import { Inject, Injectable } from '@nestjs/common';
import { Product, SearchResultItem } from '@shoppi/api-interfaces';
import { ItemSetRepository } from '../db/item-set.repository';
import { Supermarket, Supermarkets } from './supermarket';

export class InvalidIdException extends Error {
  constructor(id: string) {
    super('Invalid ID or Product not found: ' + id);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidIdException.prototype);
  }
}

@Injectable()
export class SupermarketService {

  constructor(
    @Inject(Supermarkets) private readonly supermarkets: Supermarket[],
    private itemSetRepo: ItemSetRepository,
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

  public async getMultipleItems(ids: string[]): Promise<Product[]> {
    return Promise.all(ids.map((id) => this.getSingleItem(id)));
  }

  public async getSingleItem(id: string): Promise<Product> {
    const match = id.match(/^(\w+)\:(.+)$/);
    if (!match) {
      throw new InvalidIdException(id);
    }

    for (const supermarket of this.supermarkets) {
      const prefix = supermarket.getPrefix();
      if (prefix === match[1]) {
        return supermarket.getProduct(match[2]);
      }
    }
    throw new InvalidIdException(id);
  }
}
