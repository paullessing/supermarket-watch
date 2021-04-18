import { BadRequestException, Controller, Get, NotFoundException, Param } from '@nestjs/common';

export interface Price {
  cost: number;
  costPerUnit: number;
  unitCount: number;
  unit: string;
}

export interface ReturnValue {
  name: string;
  imageUrl: string;
  price: Price;
  defaultPrice: Price;
}

@Controller('api/price')
export class PriceController {

  constructor(
  ) {}

  @Get(':id')
  public async getById(@Param('id') id: string): Promise<ReturnValue> {
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
