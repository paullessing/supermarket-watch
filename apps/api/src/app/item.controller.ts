import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { Item, ItemService } from './db/item.service';
import { SupermarketService } from './supermarkets';

@Controller('api/items')
export class ItemController {

  constructor(
    private supermarketService: SupermarketService,
    private itemService: ItemService,
  ) {}

  @Post('')
  public async addItem(
    @Body('name') name: string,
    @Body('productIds') productIds: string[],
  ): Promise<Item> {
    return await this.itemService.createItem(name, productIds);

    // const products: Product[] = await Promise.all(productIds.map(async (productId) => {
    //   let result: Product;
    //   try {
    //     result = await this.supermarketService.getSingleItem(productId);
    //   } catch (e) {
    //     throw new BadRequestException(e);
    //   }
    //   if (!result) {
    //     throw new NotFoundException('ID not found: ' + productId);
    //   }
    //   return result;
    // }));
    //
    // const now = new Date();
    //
    // const itemSet: ItemSet = {
    //   _id: undefined,
    //   name: name,
    //   variants: products.map((product) => ({
    //     supermarketId: product.id,
    //     priceHistory: [{ price: product.price, date: now }],
    //     regularPrice: product.price,
    //   })),
    // };
    //
    // return await this.itemSetRepo.create(itemSet);
  }

  @Get(':id')
  public async getSingleItem(
    @Param('id') id: string,
  ): Promise<Item> {
    console.log('HELLOW', id);


    const item = await this.itemService.getItem(id);

    if (!item) {
      throw new NotFoundException();
    }

    return item;
  }
}
