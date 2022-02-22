import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AddTrackedProduct, ProductSearchResults } from '@shoppi/api-interfaces';
import { TrackedProductsRepository } from './db/tracked-products.repository';
import { Product } from './product.model';
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
    @Param('trackingId') trackingId: string | undefined
  ): Promise<AddTrackedProduct> {
    let product: Product;

    try {
      product = await this.supermarketService.getSingleItem(productId);
    } catch (e) {
      console.error(e);
      throw new BadGatewayException(e);
    }

    const now = new Date();

    console.log(`Updating tracking ID "${trackingId}"`, product);
    const resultId = await this.trackingRepo.addOrCreateTracking(trackingId, product, now);

    return {
      trackingId: resultId,
    };
  }

  @Delete('/all')
  @HttpCode(204)
  public async deleteAll(): Promise<void> {
    await this.trackingRepo.removeAllTrackedProducts();
    await this.trackingRepo.removeAllHistory();
  }

  @Get('/search')
  public async search(@Query('term') searchTerm: string): Promise<ProductSearchResults> {
    if (!searchTerm || !searchTerm.trim()) {
      throw new BadRequestException('Query parameter "searchTerm" must not be blank');
    }
    const result = await this.trackingRepo.search(searchTerm);
    return {
      results: result.map((entry) => ({
        name: entry.name,
        trackingId: entry._id.toString(),
      })),
    };
  }
}
