import { Injectable } from '@nestjs/common';
import { Config } from '../config';
import { ItemSet } from '../models/item-set.model';
import { Repository } from './repository';

@Injectable()
export class ItemSetRepository extends Repository {
  constructor(
    config: Config,
  ) {
    super(config, 'item-set');
  }

  public async find(id: string): Promise<ItemSet | null> {
    return this.db.findOne({ _id: id });
  }

  public async findBySupermarketId(supermarketId: string): Promise<ItemSet | null> {
    return this.db.findOne({ 'variants.supermarketId': supermarketId });
  }

  public async create(item: ItemSet): Promise<ItemSet> {
    return this.db.insert(item);
  }

  public async update(item: ItemSet): Promise<ItemSet> {
    await this.db.update({ _id: item._id }, item);
    return item;
  }
}
