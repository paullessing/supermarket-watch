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
import { AddTrackedProduct, ProductSearchResults, TrackedItemGroup } from '@shoppi/api-interfaces';
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
      product = await this.supermarketService.getSingleItem(productId, new Date());
    } catch (e) {
      console.error(e);
      throw new BadGatewayException(e);
    }

    console.log(`Updating tracking ID "${trackingId}"`, product);
    const resultId = await this.trackingRepo.addOrCreateTracking(trackingId, product);

    return {
      trackingId: resultId,
    };
  }

  @Get('/')
  public async getTrackedItems(
    @Query('force') force: string,
    @Query('promotionsOnly') promotionsOnly: string
  ): Promise<{ items: TrackedItemGroup[] }> {
    const trackedProducts = await this.supermarketService.getAllTrackedProducts(new Date());

    if (promotionsOnly) {
      return {
        items: trackedProducts.filter(({ products }) => products.find(({ specialOffer }) => !!specialOffer)),
      };
    }

    return {
      items: trackedProducts,
    };
  }

  @Delete('/all')
  @HttpCode(204)
  public async deleteAll(): Promise<void> {
    await this.trackingRepo.removeAllTrackedProducts();
    await this.trackingRepo.removeAllHistory();
  }

  @Delete('/:trackingId')
  @HttpCode(204)
  public async deleteTrackedProduct(@Param('trackingId') trackingId: string): Promise<void> {
    await this.trackingRepo.removeTrackedProduct(trackingId);
  }

  @Delete('/:trackingId/:productId')
  @HttpCode(204)
  public async removeProductFromTrackingGroup(
    @Param('trackingId') trackingId: string,
    @Param('productId') productId: string
  ): Promise<void> {
    await this.trackingRepo.removeProductFromTrackingGroup(trackingId, productId);
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
