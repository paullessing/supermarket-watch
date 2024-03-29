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
import { parseISO } from 'date-fns';
import {
  AddTrackedProduct,
  ManualConversion,
  PriceComparison,
  ProductSearchResult,
  ProductSearchResults,
  standardiseUnit,
} from '@shoppi/api-interfaces';
import { ConversionService } from './conversion.service';
import { EntityNotFoundError } from './db/entity-not-found.error';
import { ProductRepository } from './db/product-repository.service';
import { SupermarketProduct } from './supermarket-product.model';
import { SupermarketService } from './supermarkets';

@Controller('api/price-comparisons')
export class PriceComparionsController {
  constructor(
    private readonly productRepo: ProductRepository,
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
      resultId = await this.productRepo.addToComparison(comparisonId, product, new Date(), manualConversion);
    } else {
      // Consider allowing user to set units on creation
      resultId = await this.productRepo.createPriceComparison(
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
    const forceFresh = force ? (force as 'none' | 'all' | 'today') : 'none';
    const trackedProducts = await this.supermarketService.getAllPriceComparisons(new Date(), { forceFresh });

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
    await this.productRepo.removeAllComparisons();
    await this.productRepo.removeAllHistory();
  }

  @Delete('/:trackingId')
  @HttpCode(204)
  public async deleteTrackedProduct(@Param('trackingId') trackingId: string): Promise<void> {
    await this.productRepo.removeComparison(trackingId);
  }

  @Delete('/:trackingId/:productId')
  @HttpCode(204)
  public async removeProductFromTrackingGroup(
    @Param('trackingId') trackingId: string,
    @Param('productId') productId: string
  ): Promise<void> {
    await this.productRepo.removeProductFromComparison(trackingId, productId);
  }

  @Get('/search')
  public async search(@Query('term') searchTerm: string): Promise<ProductSearchResults> {
    if (!searchTerm || !searchTerm.trim()) {
      throw new BadRequestException('Query parameter "searchTerm" must not be blank');
    }
    const result = await this.productRepo.search(searchTerm);
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
  ): Promise<PriceComparison> {
    try {
      return this.productRepo.updatePriceComparisonConfig(trackingId, {
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

  @Get('/offers')
  public async getProductsOnOffer(@Query('since') since: string): Promise<{ items: PriceComparison[] }> {
    let startDate: Date | null = null;
    if (since) {
      try {
        startDate = parseISO(since);
      } catch (e) {
        console.error(e);
        throw new BadRequestException('Invalid format for parameter "since", ISO-8601 string expected');
      }
    }

    if (!startDate) {
      throw new BadRequestException('Parameter "since" is required');
    }

    return { items: await this.productRepo.getProductsWithSpecialOffersStartingSince(startDate) };
  }
}
