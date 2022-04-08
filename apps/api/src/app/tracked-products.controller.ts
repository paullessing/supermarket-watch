import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  AddTrackedProduct,
  ManualConversion,
  ProductSearchResult,
  ProductSearchResults,
  standardiseUnit,
  TrackedItemGroup,
} from '@shoppi/api-interfaces';
import { ConversionService } from './conversion.service';
import { EntityNotFoundError } from './db/entity-not-found.error';
import { TrackedProductsRepository } from './db/tracked-products.repository';
import { Product } from './product.model';
import { SupermarketService } from './supermarkets';

@Controller('api/tracked-products')
export class TrackedProductsController {
  constructor(
    private readonly trackingRepo: TrackedProductsRepository,
    private readonly supermarketService: SupermarketService,
    private readonly conversionService: ConversionService
  ) {}

  @Post('/:trackingId?')
  public async addTracking(
    @Param('trackingId') trackingId: string | undefined,
    @Body('productId') productId: string,
    @Body('manualConversion')
    manualConversionData: { fromUnit: string; fromQuantity: number; toUnit: string; toQuantity: number } | undefined
  ): Promise<AddTrackedProduct> {
    let product: Product;

    console.log('addTracking', trackingId, productId, manualConversionData);

    try {
      product = await this.supermarketService.getSingleItem(productId, new Date());
    } catch (e) {
      console.error(e);
      throw new BadGatewayException(e);
    }

    const manualConversion: ManualConversion | undefined = manualConversionData
      ? [
          { name: standardiseUnit(manualConversionData.fromUnit), multiplier: manualConversionData.fromQuantity },
          { name: standardiseUnit(manualConversionData.toUnit), multiplier: manualConversionData.toQuantity },
        ]
      : undefined;

    console.log(`Updating tracking ID "${trackingId}"`, product, manualConversion);
    let resultId: string;
    if (trackingId) {
      resultId = await this.trackingRepo.addToTracking(trackingId, product, new Date(), manualConversion);
    } else {
      // Consider allowing user to set units on creation
      resultId = await this.trackingRepo.createTracking(
        product,
        product.unitName,
        product.unitAmount,
        new Date(),
        manualConversion
      );
    }

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
    const results = result.map((entry): ProductSearchResult => {
      const units = this.conversionService.getConvertableUnits(
        entry.products.map(({ product }) => product.unitName),
        entry.manualConversions
      );

      return {
        name: entry.name,
        trackingId: entry._id.toString(),
        units,
      };
    });

    return { results };
  }

  @Patch('/:trackingId')
  public async editTrackedProduct(
    @Param('trackingId') trackingId: string,
    @Body('name') name: string
  ): Promise<TrackedItemGroup> {
    try {
      return this.trackingRepo.updateProduct(trackingId, {
        name,
      });
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new NotFoundException(`Tracking ID "${trackingId}" not found`);
      }
      console.error(e);
      throw new InternalServerErrorException(e);
    }
  }
}
