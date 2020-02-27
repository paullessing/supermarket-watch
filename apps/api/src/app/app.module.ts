import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import path from 'path';
import { ProductsController } from '../product/products.controller';
import { SearchController } from '../search/search.controller';
import { Config } from './config.service';
import { SupermarketService } from './supermarket.service';
import { Sainsburys } from './supermarkets/sainsburys';
import { Tesco } from './supermarkets/tesco';
import { Waitrose } from './supermarkets/waitrose';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'frontend')
    })
  ],
  controllers: [
    ProductsController,
    SearchController,
  ],
  providers: [
    Config,
    SupermarketService,
    Sainsburys,
    Waitrose,
    Tesco,
  ]
})
export class AppModule {}
