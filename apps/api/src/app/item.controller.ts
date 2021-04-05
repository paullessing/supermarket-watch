import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { Product } from '@shoppi/api-interfaces';
import { ItemSetRepository } from './db/item-set.repository';
import { ItemSet } from './models/item-set.model';
import { SupermarketService } from './supermarkets';

@Controller('api/items')
export class ItemController {

  constructor(
    private supermarketService: SupermarketService,
    private itemSetRepo: ItemSetRepository,
  ) {}

  @Post('')
  public async addItemSet(
    @Body('name') name: string,
    @Body('supermarketIds') supermarketIds: string[],
  ): Promise<ItemSet> {
    const products: Product[] = await Promise.all(supermarketIds.map(async (id) => {
      let result: Product;
      try {
        result = await this.supermarketService.getSingleItem(id);
      } catch (e) {
        throw new BadRequestException(e);
      }
      if (!result) {
        throw new NotFoundException('ID not found: ' + id);
      }
      return result;
    }));

    const now = new Date();

    const itemSet: ItemSet = {
      _id: undefined,
      name: name,
      variants: products.map((product) => ({
        supermarketId: product.id,
        priceHistory: [{ price: product.price, date: now }],
        regularPrice: product.price,
      })),
    };

    return await this.itemSetRepo.create(itemSet);
  }

  @Get(':id')
  public async get(
    @Param('id') id: string,
  ): Promise<ItemSet> {
    const itemSet = await this.itemSetRepo.find(id);

    if (!itemSet) {
      throw new NotFoundException();
    }

    return itemSet;
  }
}
