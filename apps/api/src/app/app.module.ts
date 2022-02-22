import path from 'path';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigProvider } from './config';
import { ConversionService } from './conversion.service';
import { CronService } from './cron.service';
import { dbProviders } from './db/db.providers';
import { TrackedProductsRepository } from './db/tracked-products.repository';
import { ProductsController } from './products.controller';
import { SearchController } from './search.controller';
import { Sainsburys, Supermarket, Supermarkets, SupermarketService, Tesco, Waitrose } from './supermarkets';
import { DevCacheService } from './supermarkets/dev-cache.service';
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
    SupermarketService,
    Sainsburys,
    Waitrose,
    Tesco,
    TrackedProductsRepository,
    CronService,
    ...(process.env['USE_CACHE'] ? [DevCacheService.provider()] : []),
    ConversionService,
  ],
})
export class AppModule {}
