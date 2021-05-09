import { BadRequestException, Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { FavouritesRepository } from './db/favourites.repository';
import { SupermarketService } from './supermarkets';
import { Product, SearchResult } from '@shoppi/api-interfaces';

@Controller('api/search')
export class SearchController {

  constructor(
    private supermarketService: SupermarketService,
    private favouritesRepo: FavouritesRepository,
  ) {}

  @Get()
  public async search(@Query('q') query: string): Promise<SearchResult> {
    if (!query) {
      throw new BadRequestException('Missing required query parameter "q"');
    }
    const supermarketItems = await this.supermarketService.search(query);
    if (!supermarketItems) {
      throw new NotFoundException();
    }

    const favourites = await this.favouritesRepo.getFavourites(supermarketItems.map(({ id }) => id));

    const items = supermarketItems.map((item) => ({
      ...item,
      isFavourite: favourites.indexOf(item.id) >= 0,
    }));

    return { items };
  }
}
