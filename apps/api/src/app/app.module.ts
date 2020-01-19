import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { ProductsController } from '../product/products.controller';
import { Sainsburys } from './supermarkets/sainsburys';
import { Waitrose } from './supermarkets/waitrose';
import { Tesco } from './supermarkets/tesco';
import { Config } from './config.service';
import { SupermarketService } from './supermarket.service';
import { SearchController } from '../search/search.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
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
