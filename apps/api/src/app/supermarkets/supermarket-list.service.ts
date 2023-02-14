import { Inject, Injectable } from '@nestjs/common';
import { standardiseUnit } from '@shoppi/api-interfaces';
import { SupermarketProduct } from '../supermarket-product.model';
import { SearchResultItemWithoutTracking, Supermarket, Supermarkets } from './supermarket';

export class InvalidIdException extends Error {
  public readonly explanation: string | undefined;

  constructor(id: string, explanation?: string) {
    super('Invalid ID or Product not found: ' + id);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidIdException.prototype);

    this.explanation = explanation;
  }
}

@Injectable()
export class SupermarketList {
  constructor(@Inject(Supermarkets) private readonly supermarkets: Supermarket[]) {}

  /**
   * @throws InvalidIdException if the ID is invalid or the product is not found
   */
  public async fetchProduct(id: string): Promise<SupermarketProduct> {
    const match = id.match(/^(\w+):(.+)$/);
    if (!match) {
      throw new InvalidIdException(id, 'Invalid ID format');
    }

    for (const supermarket of this.supermarkets) {
      const prefix = supermarket.getPrefix();
      if (prefix === match[1]) {
        let product: SupermarketProduct | null = await supermarket.getProduct(match[2]);

        if (product) {
          // console.log('PRODUCT', product);

          product = {
            ...product,
            unitName: standardiseUnit(product.unitName),
          };

          // console.log('PRODUCT RET', product);
          return product;
        } else {
          throw new InvalidIdException(id, 'Item ID not found at supermarket');
        }
      }
    }

    throw new InvalidIdException(id, 'ID did not match any supermarkets');
  }

  public async search(query: string): Promise<SearchResultItemWithoutTracking[]> {
    if (!this.supermarkets.length) {
      return [];
    }

    const resultsBySupermarket = await Promise.all(
      this.supermarkets.map(async (supermarket) => {
        try {
          return await supermarket.search(query).then(({ items }) => items);
        } catch (e) {
          console.error(e);
          return [];
        }
      })
    );

    return ([] as SearchResultItemWithoutTracking[]).concat.apply([], resultsBySupermarket);
  }
}
