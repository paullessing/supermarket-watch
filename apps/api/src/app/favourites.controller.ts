import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Product } from '@shoppi/api-interfaces';
import { FavouritesRepository } from './db/favourites.repository';
import { TrackedProductsRepository } from './db/tracked-products.repository';
import { SupermarketService } from './supermarkets';

@Controller('api/favourites')
export class FavouritesController {
  constructor(
    private readonly supermarketService: SupermarketService,
    private readonly favouritesRepo: FavouritesRepository,
    private readonly trackedProductsRepo: TrackedProductsRepository
  ) {}

  @Get('/')
  public async searchFavourites(
    @Query('force') force: string,
    @Query('promotionsOnly') promotionsOnly: string
  ): Promise<{ items: Product[] }> {
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

  @Post('/')
  public async setFavourite(
    @Body('isFavourite') isFavourite: boolean,
    @Body('itemId') itemId: string
  ): Promise<{ done: boolean }> {
    await this.favouritesRepo.setFavourite(itemId, isFavourite);
    return { done: true };
  }
}
