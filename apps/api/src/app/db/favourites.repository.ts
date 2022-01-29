import { Injectable } from '@nestjs/common';
import { Config } from '../config';
import { TimestampedDocument } from './timestamped-document';
import { Repository } from './repository';

interface Favourite extends TimestampedDocument {
  itemId: string;
}

@Injectable()
export class FavouritesRepository {

  private repo: Repository<Favourite>;

  constructor(
    config: Config,
  ) {
    this.repo = new Repository(config, 'favourites');
  }

  public async setFavourite<T extends boolean>(itemId: string, isFavourite: T): Promise<T> {
    if (isFavourite && await this.repo.count({ itemId }) === 0) {
      await this.repo.create({
        _id: undefined,
        itemId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    if (!isFavourite) {
      await this.repo.removeOne({ itemId });
    }

    return isFavourite;
  }

  public async getAll(): Promise<string[]> {
    return this.repo.db.find({}).sort({ createdAt: 1 })
      .map(({ itemId }) => itemId)
      .toArray();
  }

  public async getFavourites(itemIds: string[]): Promise<string[]> {
    return this.repo.db.find<{ itemId: string }>({ itemId: { $in: itemIds } }, { projection: { itemId: 1 } })
      .map((x) => x.itemId)
      .toArray();
  }
}
