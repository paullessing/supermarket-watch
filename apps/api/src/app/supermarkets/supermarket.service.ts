import { Inject, Injectable, Optional } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import { SearchResultItem, SortBy, SortOrder, standardiseUnit, TrackedItemGroup } from '@shoppi/api-interfaces';
import { UnreachableCaseError } from '@shoppi/util';
import { TrackedProductsRepository } from '../db/tracked-products.repository';
import { Product } from '../product.model';
import { DevCacheService } from './dev-cache.service';
import { SearchResultItemWithoutTracking, Supermarket, Supermarkets } from './supermarket';

export class InvalidIdException extends Error {
  constructor(id: string) {
    super('Invalid ID or Product not found: ' + id);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidIdException.prototype);
  }
}

@Injectable()
export class SupermarketService {
  constructor(
    @Inject(Supermarkets) private readonly supermarkets: Supermarket[],
    private readonly trackedProductsRepo: TrackedProductsRepository,
    @Optional() private readonly cache: DevCacheService
  ) {}

  public async search(
    query: string,
    sortBy: SortBy = SortBy.NONE,
    sortOrder: SortOrder = SortOrder.ASCENDING
  ): Promise<SearchResultItem[]> {
    let cachedResults: SearchResultItemWithoutTracking[] | null = null;
    if (this.cache) {
      cachedResults = this.cache.getSearch(`${query}|${sortBy}|${sortOrder}`);
    }
    let searchResults: SearchResultItemWithoutTracking[];
    if (cachedResults) {
      searchResults = cachedResults;
    } else {
      const resultsBySupermarket = await Promise.all(
        this.supermarkets.map(async (supermarket) => {
          try {
            return await supermarket.search(query).then(({ items }) => items);
          } catch (e) {
            console.error(e);
            return [];
          }
        })
      );

      searchResults = ([] as SearchResultItemWithoutTracking[]).concat.apply([], resultsBySupermarket);
    }

    const trackedItems = await this.trackedProductsRepo.getTrackedIds(searchResults.map(({ id }) => id));
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

    console.log('Search results', results);

    if (this.cache && !cachedResults) {
      this.cache.storeSearch(`${query}|${sortBy}|${sortOrder}`, results);
    }

    return this.sortResults(results, sortBy, sortOrder);
  }

  public async getMultipleItems(ids: string[], now: Date, forceFresh: boolean = false): Promise<Product[]> {
    return Promise.all(
      ids.map((id) =>
        this.getSingleItem(id, now, forceFresh).catch((e) => {
          console.log('Failed to fetch item', id, e);
          throw e;
        })
      )
    );
  }

  public async getAllTrackedProducts(
    now: Date,
    { forceFresh = false, sortByPrice = true } = {}
  ): Promise<TrackedItemGroup[]> {
    if (forceFresh) {
      const startOfToday = startOfDay(now);
      const outdatedIds = await this.trackedProductsRepo.getOutdatedProductIds(startOfToday);
      await this.getMultipleItems(outdatedIds, now, true);
    }

    const trackedProducts = await this.trackedProductsRepo.getAllTrackedProducts();

    return trackedProducts.map(({ id, name, products, unitName, unitAmount }) => ({
      id,
      name,
      unitName,
      unitAmount,
      products: products.sort((a, b) => {
        if (sortByPrice) {
          return a.pricePerUnit - b.pricePerUnit;
        } else {
          return 0;
        }
      }),
    }));
  }

  /**
   * @throws InvalidIdException if the ID is invalid or the product is not found
   */
  public async getSingleItem(id: string, now: Date, forceFresh: boolean = false): Promise<Product> {
    const match = id.match(/^(\w+):(.+)$/);
    if (!match) {
      throw new InvalidIdException(id);
    }

    if (!forceFresh) {
      const updatedAfter = startOfDay(now);
      const cachedValue = await this.trackedProductsRepo.getProduct(id, updatedAfter);
      if (cachedValue) {
        console.debug('Cache hit for ' + id);
        return cachedValue;
      }
    }

    for (const supermarket of this.supermarkets) {
      const prefix = supermarket.getPrefix();
      if (prefix === match[1]) {
        let product: Product | null = null;
        if (this.cache) {
          product = this.cache.getProduct(id);
        }
        if (!product) {
          product = await supermarket.getProduct(match[2]);
        }

        if (product) {
          product = {
            ...product,
            unitName: standardiseUnit(product.unitName),
          };

          console.debug(forceFresh ? 'Forced refresh, storing' : 'Cache miss, storing', id);
          await this.trackedProductsRepo.addToHistory(product, now);

          if (this.cache) {
            this.cache.storeProduct(product);
          }

          return product;
        }
      }
    }
    throw new InvalidIdException(id);
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
}
