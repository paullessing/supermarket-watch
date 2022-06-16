import { Inject, Injectable } from '@nestjs/common';
import { standardiseUnit } from '@shoppi/api-interfaces';
import { Supermarket, Supermarkets } from './supermarket';
import { SupermarketProduct } from './supermarket-product.model';
import { InvalidIdException } from './supermarket.service';

@Injectable()
export class SupermarketClient {
  constructor(@Inject(Supermarkets) private readonly supermarkets: Supermarket[]) {}

  public async fetchProduct(id: string): Promise<SupermarketProduct> {
    const match = id.match(/^(\w+):(.+)$/);
    if (!match) {
      throw new InvalidIdException(id);
    }

    for (const supermarket of this.supermarkets) {
      const prefix = supermarket.getPrefix();
      if (prefix === match[1]) {
        let product: SupermarketProduct | null = await supermarket.getProduct(match[2]);

        if (product) {
          console.log('PRODUCT', product);

          product = {
            ...product,
            unitName: standardiseUnit(product.unitName),
          };

          console.log('PRODUCT RET', product);
          return product;
        }
      }
    }

    throw new InvalidIdException(id);
  }
}
