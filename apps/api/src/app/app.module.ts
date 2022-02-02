import path from 'path';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigProvider } from './config';
import { CronService } from './cron.service';
import { FavouritesRepository } from './db/favourites.repository';
import { ProductRepository } from './db/product.repository';
import { TrackedProductsRepository } from './db/tracked-products.repository';
import { FavouritesController } from './favourites.controller';
import { ProductsController } from './products.controller';
import { SearchController } from './search.controller';
import { Sainsburys, Supermarket, Supermarkets, SupermarketService, Tesco, Waitrose } from './supermarkets';
import { TrackedProductsController } from './tracked-products.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'frontend'),
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [ProductsController, SearchController, FavouritesController, TrackedProductsController],
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
    TrackedProductsRepository,
    CronService,
  ],
})
export class AppModule {}
