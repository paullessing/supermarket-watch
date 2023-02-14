import path from 'path';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigProvider } from './config';
import { ConversionService } from './conversion.service';
import { CronService } from './cron.service';
import { dbProviders } from './db/db.providers';
import { ProductPriceCalculator } from './db/product-price-calculator.service';
import { ProductRepository } from './db/product-repository.service';
import { PriceComparionsController } from './price-comparions.controller';
import { ProductsController } from './products.controller';
import { SearchController } from './search.controller';
import { Sainsburys, Supermarket, Supermarkets, SupermarketService, Tesco, Waitrose } from './supermarkets';
import { SupermarketList } from './supermarkets/supermarket-list.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'frontend'),
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [ProductsController, SearchController, PriceComparionsController],
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
    ProductRepository,
    CronService,
    ConversionService,
    ProductPriceCalculator,
  ],
})
export class AppModule {}
