import { Inject, Injectable } from '@nestjs/common';
import { Product, SearchResultItem } from '@shoppi/api-interfaces';
import { startOfDay } from 'date-fns';
import { ProductRepository } from '../db/product.repository';
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
    private readonly productRepo: ProductRepository,
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

  public async getMultipleItems(ids: string[], forceFresh: boolean = false): Promise<Product[]> {
    return Promise.all(ids.map((id) =>
      this.getSingleItem(id, forceFresh).catch((e) => {
        console.log('Failed to fetch item', id, e);
        throw e;
      })
    ));
  }

  public async getSingleItem(id: string, forceFresh: boolean = false): Promise<Product> {
    const match = id.match(/^(\w+):(.+)$/);
    if (!match) {
      throw new InvalidIdException(id);
    }

    if (!forceFresh) {
      const updatedAfter = startOfDay(new Date());
      const cachedValue = await this.productRepo.get(id, updatedAfter);
      if (cachedValue) {
        console.debug('Cache hit for ' + id);
        return cachedValue;
      }
    }

    for (const supermarket of this.supermarkets) {
      const prefix = supermarket.getPrefix();
      if (prefix === match[1]) {
        const product = await supermarket.getProduct(match[2]);
        if (product) {
          if (forceFresh) {
            console.debug('Forced refresh', id);
          } else {
            console.debug('Cache miss, storing', id);
          }
          await this.productRepo.save(product);
        }
        return product;
      }
    }
    throw new InvalidIdException(id);
  }
}
