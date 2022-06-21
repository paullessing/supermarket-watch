import path from 'path';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigProvider } from './config';
import { ConversionService } from './conversion.service';
import { CronService } from './cron.service';
import { dbProviders } from './db/db.providers';
import { ProductPriceCalculator } from './db/product-price-calculator.service';
import { TrackedProductsRepository } from './db/tracked-products.repository';
import { ProductsController } from './products.controller';
import { SearchController } from './search.controller';
import {
  Sainsburys,
  Supermarket,
  SupermarketList,
  Supermarkets,
  SupermarketService,
  Tesco,
  Waitrose,
} from './supermarkets';
import { TrackedProductsController } from './tracked-products.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'frontend'),
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [ProductsController, SearchController, TrackedProductsController],
  providers: [
    {
      provide: Supermarkets,
      useFactory: (...supermarkets: Supermarket[]) => supermarkets,
      inject: [Sainsburys, Waitrose, Tesco],
    },
    ConfigProvider,
    ...dbProviders,
    SupermarketList,
    SupermarketService,
    Sainsburys,
    Waitrose,
    Tesco,
    TrackedProductsRepository,
    CronService,
    ConversionService,
    ProductPriceCalculator,
  ],
})
export class AppModule {}
