import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FavouritesRepository } from './db/favourites.repository';
import { SupermarketService } from './supermarkets';

@Injectable()
export class CronService {
  constructor(
    private readonly favouritesRepo: FavouritesRepository,
    private readonly supermarketService: SupermarketService,
  ) {
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    name: 'regenerateFavouritesData',
    timeZone: 'Europe/London',
  })
  public async regenerateFavouriteData(): Promise<void> {
    console.log('Starting cronjob to refresh favourites data');
    const favourites = await this.favouritesRepo.getAll();
    console.log(`Refreshing ${favourites.length} items...`);

    const results = await this.supermarketService.getMultipleItems(favourites, true);

    console.log(`Refreshed ${results.length} items.`);
    console.log(`Cronjob completed.`);
  }
}
