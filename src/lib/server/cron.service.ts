import { RecurrenceRule, scheduleJob } from 'node-schedule';
import { $productRepository } from './db/product-repository.service';
import { $supermarketService } from './supermarkets';
import { env } from '$env/dynamic/private';

const EVERY_DAY_AT_1AM = new RecurrenceRule();
EVERY_DAY_AT_1AM.hour = 1;
EVERY_DAY_AT_1AM.tz = 'Etc/UTC';

export class CronService {
  constructor() {
    if (env['RUN_MIGRATION'] === 'true') {
      console.log('Running Migration...');
      this.regenerateFavouriteData();
    }
  }

  public setupCronjobs(): void {
    console.log('Initialising cron');
    scheduleJob('regenerateFavouriteData', EVERY_DAY_AT_1AM, () => {
      this.regenerateFavouriteData();
    });
  }

  public async regenerateFavouriteData(): Promise<void> {
    const productRepo = await $productRepository;
    const supermarketService = await $supermarketService;

    console.log('Starting cronjob to refresh favourites data');
    const favourites = await productRepo.getAllTrackedIds();
    console.log(`Refreshing ${favourites.length} items...`);

    const results = await supermarketService.refreshMultipleItems(
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

export const cronService = new CronService();
