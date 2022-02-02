import { Inject, Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import { Product, SearchResultItem, SortBy, SortOrder } from '@shoppi/api-interfaces';
import { UnreachableCaseError } from '@shoppi/util';
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
    private readonly productRepo: ProductRepository
  ) {}

  public async search(
    query: string,
    sortBy: SortBy = SortBy.NONE,
    sortOrder: SortOrder = SortOrder.ASCENDING
  ): Promise<SearchResultItem[]> {
    const resultsBySupermarket = await Promise.all(
      this.supermarkets.map((supermarket) => supermarket.search(query).then(({ items }) => items))
    );

    const results: SearchResultItem[] = ([] as SearchResultItem[]).concat.apply([], resultsBySupermarket);

    return this.sortResults(results, sortBy, sortOrder);
  }

  public async getMultipleItems(ids: string[], forceFresh: boolean = false): Promise<Product[]> {
    return Promise.all(
      ids.map((id) =>
        this.getSingleItem(id, forceFresh).catch((e) => {
          console.log('Failed to fetch item', id, e);
          throw e;
        })
      )
    );
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

  private sortResults(results: SearchResultItem[], sortBy: SortBy, sortOrder: SortOrder): SearchResultItem[] {
    const multiplier = sortOrder === SortOrder.ASCENDING ? 1 : -1;

    switch (sortBy) {
      case SortBy.NONE:
        return results;
      case SortBy.PRICE:
        return results.slice().sort((a, b) => multiplier * (a.price - b.price));
      case SortBy.SUPERMARKET:
        return results.slice().sort((a, b) => multiplier * a.supermarket.localeCompare(b.supermarket));
      default:
        throw new UnreachableCaseError(sortBy);
    }
  }
}
