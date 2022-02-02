import { Body, Controller, Param, Post } from '@nestjs/common';
import { TrackedProductsRepository } from './db/tracked-products.repository';

@Controller('api/tracked-products')
export class TrackedProductsController {
  constructor(private readonly trackingRepo: TrackedProductsRepository) {}

  @Post('/:trackingId?')
  public async addTracking(
    @Body('productId') productId: string,
    @Param('trackingId') trackingId: string
  ): Promise<{ trackingId: string }> {
    return await this.trackingRepo.save(trackingId, productId);
  }
}
