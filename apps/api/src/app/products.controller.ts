import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ComparisonProductData, ProductDetails } from '@shoppi/api-interfaces';
import { TrackedProductsRepository } from './db/tracked-products.repository';
import { InvalidIdException, SupermarketProduct, SupermarketService } from './supermarkets';

@Controller('api/products')
export class ProductsController {
  constructor(
    private readonly supermarketService: SupermarketService,
    private readonly trackedProductsRepository: TrackedProductsRepository
  ) {}

  // TODO
  // Figure out which endpoints should return which data, and which version of Product we actually want to store.
  // Once that's sorted, it should hopefully be clear what the interface of Product vs HistoricalProduct vs SupermarketProduct should be.
  // We may not need Product.

  @Get('/:id')
  public async getById(@Param('id') id: string, @Query('force') force: string): Promise<ProductDetails> {
    if (!id) {
      throw new BadRequestException('Missing required URL parameter "id"');
    }
    try {
      console.log(`Fetching product ${id}${force === 'true' ? ' (forced)' : ''}`);
      return toProductDetails(await this.supermarketService.getSingleItem(id, new Date(), force === 'true'));
    } catch (e) {
      if (e instanceof InvalidIdException) {
        throw new NotFoundException();
      }
      throw e;
    }
  }

  @Get('/:id/history')
  public async getHistory(
    @Param('id') id: string
  ): Promise<{ history: Awaited<ReturnType<TrackedProductsRepository['getHistory']>> }> {
    if (!id) {
      throw new BadRequestException('Missing required URL parameter "id"');
    }
    const history = await this.trackedProductsRepository.getHistory(id);

    return { history };
  }

  @Get('/')
  public async getMultipleById(@Query('ids') idsQuery: string | string[]): Promise<{ items: ComparisonProductData[] }> {
    if (!idsQuery) {
      throw new BadRequestException('Missing required URL parameter "ids"');
    }
    const ids = Array.isArray(idsQuery) ? idsQuery : idsQuery.split(',');

    if (!ids.length) {
      throw new BadRequestException('Missing required URL parameter "ids"');
    }

    const items: ComparisonProductData[] = await Promise.all<ComparisonProductData>(
      ids.map(async (id): Promise<ComparisonProductData> => {
        try {
          const item = await this.supermarketService.getSingleItem(id, new Date());
          return toProductDetails(item);
        } catch (e) {
          if (e instanceof InvalidIdException) {
            throw new NotFoundException();
          }
          throw e;
        }
      })
    );

    return {
      items,
    };
  }
}

function toProductDetails(product: SupermarketProduct): ProductDetails {
  return {
    id: product.id,
    name: product.name,
    image: product.image,
    url: product.url,

    supermarket: product.supermarket,

    price: product.price,
    pricePerUnit: product.pricePerUnit,
    packSize: {
      unit: product.packSize.unit,
      amount: product.packSize.amount,
    },
    unitAmount: product.unitAmount,
    unitName: product.unitName,

    specialOffer: product.specialOffer,
  };
}
