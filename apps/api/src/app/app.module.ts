import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import path from 'path';
import { ConfigProvider } from './config';
import { ItemService } from './db/item.service';
import { ItemController } from './item.controller';
import { ProductsController } from './products.controller';
import { SearchController } from './search.controller';
import { Sainsburys, Supermarket, Supermarkets, SupermarketService, Tesco, Waitrose } from './supermarkets';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'frontend')
    })
  ],
  controllers: [
    ProductsController,
    SearchController,
    ItemController,
  ],
  providers: [
    ConfigProvider,
    SupermarketService,
    Sainsburys,
    Waitrose,
    Tesco,
    {
      provide: Supermarkets,
      useFactory: (...supermarkets: Supermarket[]) => supermarkets,
      inject: [Sainsburys, Waitrose, Tesco],
    },
    ItemService,
  ]
})
export class AppModule {}
