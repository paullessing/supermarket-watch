import { Controller, Get, Query } from '@nestjs/common';
import { HistoryProduct } from '@shoppi/api-interfaces';
import { TrackedProductsRepository } from './db/tracked-products.repository';
import { SupermarketService } from './supermarkets';

@Controller('api/favourites')
export class FavouritesController {
  constructor(
    private readonly supermarketService: SupermarketService,
    private readonly trackedProductsRepo: TrackedProductsRepository
  ) {}

  @Get('/')
  public async searchFavourites(
    @Query('force') force: string,
    @Query('promotionsOnly') promotionsOnly: string
  ): Promise<{ items: HistoryProduct[] }> {
    const favourites = await this.trackedProductsRepo.getAllTrackedIds();
    const items = await this.supermarketService.getMultipleItems(favourites, force === 'true');

    if (promotionsOnly) {
      return {
        items: items.filter((item) => item.specialOffer),
      };
    }

    return {
      items,
    };
  }
}
