import { BadRequestException, Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { SearchResult, SortBy, SortOrder } from '@shoppi/api-interfaces';
import { FavouritesRepository } from './db/favourites.repository';
import { SupermarketService } from './supermarkets';

@Controller('api/search')
export class SearchController {
  constructor(
    private readonly supermarketService: SupermarketService,
    private readonly favouritesRepo: FavouritesRepository
  ) {}

  @Get()
  public async search(
    @Query('q') query: string,
    @Query('sortBy') sortBy?: SortBy,
    @Query('sortOrder') querySortOrder?: 'asc' | 'desc'
  ): Promise<SearchResult> {
    if (!query) {
      throw new BadRequestException('Missing required query parameter "q"');
    }
    if (sortBy && !Object.values(SortBy).includes(sortBy)) {
      throw new BadRequestException('Invalid query parameter "sortBy"');
    }
    let sortOrder = SortOrder.ASCENDING;
    if (querySortOrder) {
      if (!['asc', 'desc', '1', '-1', 1, -1].includes(querySortOrder)) {
        throw new BadRequestException('Query parameter "sortOrder" must be "asc", "desc", 1 or -1 if provided');
      }
      sortOrder = ['asc', '1', 1].includes(querySortOrder) ? SortOrder.ASCENDING : SortOrder.DESCENDING;
    }
    const supermarketItems = await this.supermarketService.search(query, sortBy, sortOrder);
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
