import { Body, Controller, Delete, HttpCode, NotFoundException, Param, Post, Res } from '@nestjs/common';
import { TrackedProductsRepository } from './db/tracked-products.repository';
import { SupermarketService } from './supermarkets';

@Controller('api/tracked-products')
export class TrackedProductsController {
  constructor(
    private readonly trackingRepo: TrackedProductsRepository,
    private readonly supermarketService: SupermarketService
  ) {}

  @Post('/:trackingId?')
  public async addTracking(
    @Body('productId') productId: string,
    @Param('trackingId') trackingId: string
  ): Promise<{ trackingId: string }> {
    const product = await this.supermarketService.getSingleItem(productId);
    if (!product) {
      throw new NotFoundException(`Could not find product with ID "${productId}"`);
    }

    return await this.trackingRepo.save(trackingId, product);
  }

  @Delete('/all')
  @HttpCode(204)
  public async deleteAll(): Promise<void> {
    await this.trackingRepo.removeAll();
  }
}
