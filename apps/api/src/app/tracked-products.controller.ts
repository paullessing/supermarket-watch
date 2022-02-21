import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ProductSearchResults } from '@shoppi/api-interfaces';
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
  ): Promise<{ trackingId: string }> {
    let product: Product | null = null;
    let otherProducts: Product[] = [];
    const otherProductIdsForSameTrackingId = trackingId ? await this.trackingRepo.getProductIds(trackingId) : [];

    const productIds = [productId, ...otherProductIdsForSameTrackingId];

    try {
      [product, ...otherProducts] = await this.supermarketService.getMultipleItems(productIds, false, false);
    } catch (e) {
      console.error(`Error fetching product IDs:`, productIds);
      console.error(e);
      throw new BadGatewayException(e);
    }

    if (!product) {
      throw new NotFoundException(`Could not find product with ID "${productId}"`);
    }

    if (trackingId) {
      console.log(`Updating tracking ID "${trackingId}"`, otherProducts, product);

      await this.trackingRepo.addToTrackedProduct(trackingId, otherProducts, product);

      return {
        trackingId,
      };
    } else {
      const resultId = await this.trackingRepo.createTracking(product);

      return {
        trackingId: resultId,
      };
    }
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
