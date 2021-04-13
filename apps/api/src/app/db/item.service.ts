import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Config } from '../config';
import { SupermarketService } from '../supermarkets';
import { EntityNotFoundError } from './entity-not-found.error';
import { Repository } from './repository';
import { Product as ApiProduct } from '@shoppi/api-interfaces';

export interface Item {
  _id: string;
  name: string;
  price: number;
  products: Product[];
  // TODO
  // unit
  // conversions: { [fromUnit: string]: number }
}

// TODO:
//  Remove product.model.ts and replace with this
//  All fetches should relate to a DB entity; create one if not already existing?
//  Would have to allow merging entities
export interface Product {
  productId: string;
  supermarket: string;
  maxPrice: number;
  history: {
    price: number;
    pricePerUnit: number;
    unitName: string;
    date: Date;
  }[];
}

export type Nilable<T> = T | null | undefined;

@Injectable()
export class ItemService {

  private repo: Repository<Item>;

  constructor(
    config: Config,
    private supermarketService: SupermarketService,
  ) {
    this.repo = new Repository<Item>(config, 'item.db');
  }

  public async createOrUpdateItem(itemId: Nilable<string>, productIds: string[], now: Date): Promise<Item> {
    if (await this.repo.count({ 'products.productId': { $in: productIds } }) > 0) {
      throw new ConflictException('Item with product ID already exists');
    }

    const products = await Promise.all(productIds.map((productId) => this.supermarketService.getSingleItem(productId)));

    let item = await this.getOrCreateItem(itemId, products[0].name);

    for (const product of products) {
      item = this.addOrUpdateProduct(item, product, now);
    }

    return await this.repo.update(item);
  }

  public async getItem(id: string): Promise<Item> {
    return this.repo.find(id);
  }

  public async updateName(id: string, name: string): Promise<Item> {
    if (!name) {
      throw new Error('Argument "name" is required');
    }
    const item = await this.repo.find(id);
    if (!item) {
      throw new EntityNotFoundError(id);
    }

    item.name = name;
    return this.repo.update(item);
  }

  private async getOrCreateItem(itemId: string, name: string): Promise<Item> {
    const existingItem = await this.repo.find(itemId);
    if (existingItem) {
      return existingItem;
    } else {
      return await this.repo.create({
        name,
        price: 0,
        products: [],
      });
    }
  }

  private addOrUpdateProduct(item: Item, product: ApiProduct, now: Date): Item {
    let itemProduct = item.products.find(({ productId }) => productId === product.id);
    if (!itemProduct) {
      itemProduct = {
        productId: product.id,
        supermarket: product.supermarket,
        maxPrice: 0,
        history: [],
      };
      item.products.push(itemProduct);
    }
    itemProduct.history.unshift({
      price: product.price,
      pricePerUnit: product.pricePerUnit,
      unitName: product.unitName,
      date: now,
    });

    itemProduct.maxPrice = Math.max(itemProduct.maxPrice, product.price);
    item.price = Math.min(...item.products.map(({ history: [{ price }] }) => price))

    return item;
  }
}
