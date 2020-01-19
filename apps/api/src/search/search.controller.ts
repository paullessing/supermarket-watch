import { BadRequestException, Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { SupermarketService } from '../app/supermarket.service';
import { SearchResult } from '@shoppi/api-interfaces';

@Controller('search')
export class SearchController {

  constructor(
    private supermarketService: SupermarketService
  ) {}

  @Get()
  public async search(@Query('q') query: string): Promise<SearchResult> {
    if (!query) {
      throw new BadRequestException('Missing required query parameter "q"');
    }
    const items = await this.supermarketService.search(query);
    if (!items) {
      throw new NotFoundException();
    }
    return { items };
  }
}
