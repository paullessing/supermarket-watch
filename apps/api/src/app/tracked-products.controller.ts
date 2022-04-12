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
  PriceComparison,
  ProductSearchResult,
  ProductSearchResults,
  standardiseUnit,
  TrackedItemGroup,
} from '@shoppi/api-interfaces';
import { ConversionService } from './conversion.service';
import { EntityNotFoundError } from './db/entity-not-found.error';
import { TrackedProductsRepository } from './db/tracked-products.repository';
import { SupermarketProduct, SupermarketService } from './supermarkets';

@Controller('api/price-comparisons')
export class TrackedProductsController {
  constructor(
    private readonly trackingRepo: TrackedProductsRepository,
    private readonly supermarketService: SupermarketService,
    private readonly conversionService: ConversionService
  ) {}

  @Post('/:comparisonId?')
  public async addComparison(
    @Param('comparisonId') comparisonId: string | undefined,
    @Body('productId') productId: string,
    @Body('manualConversion')
    manualConversionData: { fromUnit: string; fromQuantity: number; toUnit: string; toQuantity: number } | undefined
  ): Promise<AddTrackedProduct> {
    let product: SupermarketProduct;

    console.log('addComparison', comparisonId, productId, manualConversionData);

    try {
      // NOTE: This returns a TrackedProduct Product, but the actual "add tracking" call requires a SupermarketProduct which has more info.
      // We may need to split the responsibilities for getting cached data out of the `getSingleItem` call and make it explicit,
      // so that we can return either a "user wants this" kind of product or a "system needs all the info" kind of product.
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

    console.log(`Updating comparison ID "${comparisonId}"`, product, manualConversion);
    let resultId: string;
    if (comparisonId) {
      resultId = await this.trackingRepo.addToComparison(comparisonId, product, new Date(), manualConversion);
    } else {
      // Consider allowing user to set units on creation
      resultId = await this.trackingRepo.createPriceComparison(
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
  public async getPriceComparisons(
    @Query('force') force: string,
    @Query('promotionsOnly') promotionsOnly: string
  ): Promise<{ items: PriceComparison[] }> {
    const trackedProducts = await this.supermarketService.getAllPriceComparisons(new Date());

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
    await this.trackingRepo.removeAllComparisons();
    await this.trackingRepo.removeAllHistory();
  }

  @Delete('/:trackingId')
  @HttpCode(204)
  public async deleteTrackedProduct(@Param('trackingId') trackingId: string): Promise<void> {
    await this.trackingRepo.removeComparison(trackingId);
  }

  @Delete('/:trackingId/:productId')
  @HttpCode(204)
  public async removeProductFromTrackingGroup(
    @Param('trackingId') trackingId: string,
    @Param('productId') productId: string
  ): Promise<void> {
    await this.trackingRepo.removeProductFromComparison(trackingId, productId);
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
