import { ConflictException, Injectable } from '@nestjs/common';
import { Config } from '../config';
import { Repository } from './repository';

export interface Item {
  _id: string;
  name: string;
  productIds: string[];
  // TODO
  // unit
  // conversions: { [fromUnit: string]: number }
}

@Injectable()
export class ItemService {

  private repo: Repository<Item>;

  constructor(
    config: Config,
  ) {
    this.repo = new Repository<Item>(config, 'item.db');
  }

  public async createItem(name: string, productIds: string[]): Promise<Item> {
    if (await this.repo.count({ productIds: { $in: productIds } }) > 0) {
      throw new ConflictException('Item with product ID already exists');
    }

    return this.repo.create({
      name,
      productIds,
    });
  }

  public async getItem(id: string): Promise<Item> {
    return this.repo.find(id);
  }
}
