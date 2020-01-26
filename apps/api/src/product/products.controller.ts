import { BadRequestException, Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Product } from '@shoppi/api-interfaces';
import { SupermarketService } from '../app/supermarket.service';

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
}
