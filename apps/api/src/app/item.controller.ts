import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post
} from '@nestjs/common';
import { EntityNotFoundError } from './db/entity-not-found.error';
import { Item, ItemService } from './db/item.service';
import { SupermarketService } from './supermarkets';

@Controller('api/items')
export class ItemController {

  constructor(
    private supermarketService: SupermarketService,
    private itemService: ItemService,
  ) {}

  @Post('')
  public async createItem(
    @Body('productIds') productIds: string[],
  ): Promise<Item> {
    if (!productIds || !productIds.length) {
      throw new BadRequestException('Missing required parameter "productIds"');
    }

    const now = new Date();

    return await this.itemService.createOrUpdateItem(null, productIds, now);
  }

  @Patch(':id')
  public async addProducts(
    @Param('id') itemId: string,
    @Body('addProductIds') productIds: string[],
    @Body('setName') name: string,
  ): Promise<Item> {
    productIds = (productIds || []).filter(Boolean);
    name = (name || '').trim();

    let item: Item = await this.itemService.getItem(itemId);
    if (!item) {
      throw new NotFoundException();
    }

    if (productIds.length) {
      const now = new Date();
      item = await this.itemService.createOrUpdateItem(itemId, productIds, now);
    }

    if (name.length) {
      item = await this.itemService.updateName(itemId, name);
    }

    if (!item) {
      throw new BadRequestException('No update operations specified');
    }

    return item;
  }

  @Patch(':id/name')
  public async updateName(
    @Param('id') itemId: string,
    @Body('name') name: string,
  ): Promise<Item> {
    name = (name || '').trim();
    if (!name) {
      throw new BadRequestException('Missing required parameter "name"');
    }

    try {
      return await this.itemService.updateName(itemId, name);
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new NotFoundException();
      } else {
        console.error(e);
        throw new InternalServerErrorException();
      }
    }
  }

  @Get(':id')
  public async getSingleItem(
    @Param('id') id: string,
  ): Promise<Item> {
    const item = await this.itemService.getItem(id);

    if (!item) {
      throw new NotFoundException();
    }

    return item;
  }
}
