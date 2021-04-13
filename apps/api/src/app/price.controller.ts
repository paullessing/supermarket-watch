import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { Product } from '@shoppi/api-interfaces';
import { SupermarketService } from './supermarkets';

@Controller('api/products')
export class ProductsController {

  constructor(
    private supermarketService: SupermarketService
  ) {}

  @Get('/:id')
  public async getById(@Param('id') id: string): Promise<Product> {
    if (!id) {
      throw new BadRequestException('Missing required URL parameter "id"');
    }
    const item = await this.supermarketService.getSingleItem(id);
    if (!item) {
      throw new NotFoundException();
    }

    return item;
  }

  @Get('/')
  public async getMultipleById(@Query('ids') idsQuery: string | string[]): Promise<{ items: Product[] }> {
    if (!idsQuery) {
      throw new BadRequestException('Missing required URL parameter "ids"');
    }
    const ids = Array.isArray(idsQuery) ? idsQuery : idsQuery.split(',');

    if (!ids.length) {
      throw new BadRequestException('Missing required URL parameter "ids"');
    }

    const items = await Promise.all(ids.map(async (id): Promise<Product> => {
      const item = await this.supermarketService.getSingleItem(id);
      if (!item) {
        throw new NotFoundException();
      }
      return item;
    }));

    return {
      items
    };
  }
}
