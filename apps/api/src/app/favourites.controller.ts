import { Controller, Get, Query } from '@nestjs/common';
import { Favourites } from '@shoppi/api-interfaces';
import { SupermarketService } from './supermarkets';

@Controller('api/favourites')
export class FavouritesController {
  constructor(private readonly supermarketService: SupermarketService) {}

  @Get('/')
  public async searchFavourites(
    @Query('force') force: string,
    @Query('promotionsOnly') promotionsOnly: string
  ): Promise<{ items: Favourites[] }> {
    const favourites = await this.supermarketService.getAllTrackedProducts();

    if (promotionsOnly) {
      return {
        items: favourites.filter(({ products }) => products.find(({ specialOffer }) => !!specialOffer)),
      };
    }

    return {
      items: favourites,
    };
  }
}
