import { Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import { PriceComparison, SearchResultItem, SortBy, SortOrder } from '@shoppi/api-interfaces';
import { UnreachableCaseError } from '@shoppi/util';
import { ProductRepository } from '../db/product-repository.service';
import { SupermarketProduct } from '../supermarket-product.model';
import { SearchResultItemWithoutTracking } from './supermarket';
import { SupermarketList } from './supermarket-list.service';

@Injectable()
export class SupermarketService {
  constructor(private readonly supermarketList: SupermarketList, private readonly productRepo: ProductRepository) {}

  public async search(
    query: string,
    sortBy: SortBy = SortBy.NONE,
    sortOrder: SortOrder = SortOrder.ASCENDING
  ): Promise<SearchResultItem[]> {
    const useCache = false;
    let cachedResults: SearchResultItemWithoutTracking[] | null = null;
    if (useCache) {
      cachedResults = this.getCachedSearch(`${query}|${sortBy}|${sortOrder}`);
    }

    const searchResults: SearchResultItemWithoutTracking[] =
      cachedResults ?? (await this.supermarketList.search(query));

    const trackedItems = await this.productRepo.getTrackedIds(searchResults.map(({ id }) => id));
    console.log(
      'Tracked IDs',
      searchResults.map(({ id }) => id),
      Array.from(trackedItems.entries())
    );

    const results = searchResults.map(
      (item: SearchResultItemWithoutTracking): SearchResultItem => ({
        ...item,
        trackingId: trackedItems.get(item.id) ?? null,
      })
    );

    // console.log('Search results', results);

    if (useCache && !cachedResults) {
      this.storeCachedSearch(`${query}|${sortBy}|${sortOrder}`, results);
    }

    return this.sortResults(results, sortBy, sortOrder);
  }

  public async getMultipleItems(ids: string[], now: Date, forceFresh: boolean = false): Promise<SupermarketProduct[]> {
    return Promise.all(
      ids.map((id) =>
        this.getSingleItem(id, now, forceFresh).catch((e) => {
          console.log('Failed to fetch item', id, e);
          throw e;
        })
      )
    );
  }

  public async getAllPriceComparisons(
    now: Date,
    { forceFresh = 'none', sortByPrice = true }: { forceFresh?: 'none' | 'today' | 'all'; sortByPrice?: boolean } = {}
  ): Promise<PriceComparison[]> {
    if (forceFresh === 'today' || forceFresh === 'all') {
      const refreshLimit = forceFresh === 'today' ? startOfDay(now) : now;

      const outdatedIds = await this.productRepo.getOutdatedProductIds(refreshLimit);
      await this.getMultipleItems(outdatedIds, now, true);
    }

    const priceComparisons = await this.productRepo.getAllTrackedProducts();

    return priceComparisons.map((comparison) => ({
      ...comparison,
      products: sortByPrice ? comparison.products.sort((a, b) => a.pricePerUnit - b.pricePerUnit) : comparison.products,
    }));
  }

  /**
   * @throws InvalidIdException if the ID is invalid or the product is not found
   */
  public async getSingleItem(id: string, now: Date, forceFresh: boolean = false): Promise<SupermarketProduct> {
    if (!forceFresh) {
      const updatedAfter = startOfDay(now);
      const cachedValue = await this.productRepo.getProduct(id, updatedAfter);
      if (cachedValue) {
        console.debug('getSingleItem: Cache hit in DB for ' + id);
        return cachedValue;
      }
    }

    const product = await this.supermarketList.fetchProduct(id);

    console.debug('getSingleItem:', forceFresh ? 'Forced refresh, storing' : 'Cache miss, storing', id);
    await this.productRepo.addToHistory(product, now);

    return product;
  }

  private sortResults(results: SearchResultItem[], sortBy: SortBy, sortOrder: SortOrder): SearchResultItem[] {
    const multiplier = sortOrder === SortOrder.ASCENDING ? 1 : -1;

    switch (sortBy) {
      case SortBy.NONE:
        return results;
      case SortBy.PRICE:
        return results.slice().sort((a, b) => multiplier * (a.price - b.price));
      case SortBy.SUPERMARKET:
        return results.slice().sort((a, b) => multiplier * a.supermarket.localeCompare(b.supermarket));
      case SortBy.SPECIAL_OFFERS: {
        // Returning a negative value if the item is a special offer will prioritise special offers over regular offers, but still allow
        // sorting by price
        const specialPrice = (result: SearchResultItem): number =>
          result.specialOffer ? multiplier * -100000 + result.price : result.price;
        return results.slice().sort((a, b) => specialPrice(a) - specialPrice(b));
      }
      default:
        throw new UnreachableCaseError(sortBy);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getCachedSearch(searchId: string): SearchResultItemWithoutTracking[] | null {
    return searchId ? null : null; // implement if necessary
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private storeCachedSearch(searchId: string, results: SearchResultItemWithoutTracking[]): void {
    return searchId && results ? undefined : undefined; // implement if necessary
  }
}
