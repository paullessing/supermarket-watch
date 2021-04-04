import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import path from 'path';
import { Config } from './config.service';
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
  ],
  providers: [
    Config,
    SupermarketService,
    Sainsburys,
    Waitrose,
    Tesco,
    {
      provide: Supermarkets,
      useFactory: (...supermarkets: Supermarket[]) => supermarkets,
      inject: [Sainsburys, Waitrose, Tesco],
    },
  ]
})
export class AppModule {}
