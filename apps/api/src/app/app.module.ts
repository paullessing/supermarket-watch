import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import path from 'path';
import { ConfigProvider } from './config';
import { CronService } from './cron.service';
import { FavouritesRepository } from './db/favourites.repository';
import { ProductRepository } from './db/product.repository';
import { ProductsController } from './products.controller';
import { SearchController } from './search.controller';
import { Sainsburys, Supermarket, Supermarkets, SupermarketService, Tesco, Waitrose } from './supermarkets';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'frontend')
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    ProductsController,
    SearchController,
  ],
  providers: [
    {
      provide: Supermarkets,
      useFactory: (...supermarkets: Supermarket[]) => supermarkets,
      inject: [Sainsburys, Waitrose, Tesco],
    },
    ConfigProvider,
    SupermarketService,
    Sainsburys,
    Waitrose,
    Tesco,
    FavouritesRepository,
    ProductRepository,
    CronService,
  ]
})
export class AppModule {}
