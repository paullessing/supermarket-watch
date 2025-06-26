import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductRepository } from './db/product-repository.service';
import { SupermarketService } from './supermarkets';

@Injectable()
export class CronService {
  constructor(
    private readonly supermarketService: SupermarketService,
    private readonly productRepo: ProductRepository
  ) {
    if (process.env['RUN_MIGRATION'] === 'true') {
      this.regenerateFavouriteData();
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    name: 'regenerateFavouritesData',
    timeZone: 'Europe/London',
  })
  public async regenerateFavouriteData(): Promise<void> {
    console.log('Starting cronjob to refresh favourites data');
    const favourites = await this.productRepo.getAllTrackedIds();
    console.log(`Refreshing ${favourites.length} items...`);

    const results = await this.supermarketService.refreshMultipleItems(
      favourites,
      new Date(),
      true
    );
    const failures = results.filter(({ status }) => status === 'rejected');

    console.log(
      `Refreshed ${results.length} items. ${failures.length} failures.`
    );
    console.log(`Cronjob completed.`);
  }
}
