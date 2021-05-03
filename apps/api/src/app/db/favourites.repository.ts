import { Injectable } from '@nestjs/common';
import { Config } from '../config';
import { Repository } from './repository';

interface Favourite {
  _id: string;
  itemId: string;
}

@Injectable()
export class FavouritesRepository {

  private repo: Repository<Favourite>;

  constructor(
    config: Config,
  ) {
    this.repo = new Repository(config, 'favourites.db');
  }

  public async setFavourite<T extends boolean>(itemId: string, isFavourite: T): Promise<T> {
    if (isFavourite && await this.repo.count({ itemId }) === 0) {
      await this.repo.create({ itemId });
    }
    if (!isFavourite) {
      await this.repo.removeOne({ itemId });
    }

    return isFavourite;
  }

  public async getAll(): Promise<string[]> {
    return (await this.repo.db.find<Favourite>({}).sort({ createdAt: 1 }))
      .map(({ itemId }) => itemId);
  }

  public async getFavourites(itemIds: string[]): Promise<string[]> {
    return (await this.repo.db.find<{ itemId: string }>({ itemId: { $in: itemIds } }, { itemId: 1 }))
      .map((x) => x.itemId);
  }
}
