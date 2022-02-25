import { promises } from 'fs';
import { Injectable, Provider } from '@nestjs/common';
import { SearchResultItem } from '@shoppi/api-interfaces';
import { Product } from '../product.model';
import { SearchResultItemWithoutTracking } from './supermarket';

const { readFile, writeFile } = promises;

interface CacheEntry<T> {
  expires: number;
  data: T;
}

@Injectable()
export class DevCacheService {
  private productCache: Map<string, CacheEntry<Product>>;
  private searchCache: Map<string, CacheEntry<SearchResultItemWithoutTracking[]>>;

  private writePromise: Promise<void>;

  constructor(
    productCache: [string, CacheEntry<Product>][],
    searchCache: [string, CacheEntry<SearchResultItemWithoutTracking[]>][]
  ) {
    this.productCache = new Map(productCache.filter(([key]) => !!key));
    this.searchCache = new Map(searchCache.filter(([key]) => !!key));

    this.writePromise = Promise.resolve();

    console.debug('Cache initialised with keys: ', [
      Array.from(this.productCache.keys()),
      Array.from(this.searchCache.keys()),
    ]);
  }

  public static provider(): Provider {
    return {
      provide: DevCacheService,
      async useFactory(): Promise<DevCacheService> {
        const productCache$ = (async () => {
          try {
            const data = await readFile('/tmp/cache/product-cache.json', 'utf8');
            // console.debug('product data', data);
            return JSON.parse(data) as [string, CacheEntry<Product>][];
          } catch (e) {
            return [];
          }
        })();
        const searchCache$ = (async () => {
          try {
            const data = await readFile('/tmp/cache/search-cache.json', 'utf8');
            // console.debug('search data', data);
            return JSON.parse(data) as [string, CacheEntry<SearchResultItemWithoutTracking[]>][];
          } catch (e) {
            return [];
          }
        })();

        const [productCache, searchCache] = await Promise.all([productCache$, searchCache$]);

        return new DevCacheService(productCache, searchCache);
      },
    };
  }

  public getProduct(productId: string): Product | null {
    const entry = this.productCache.get(productId);
    if (!entry) {
      console.debug('Cache miss for product', productId);
      return null;
    }
    if (entry.expires < Date.now()) {
      console.debug('Cache expired for product', productId);
      this.productCache.delete(productId);
      return null;
    }
    console.debug('Cache hit for product', productId);
    return entry.data;
  }

  public storeProduct(product: Product): void {
    this.productCache.set(product.id, { expires: Date.now() + 48 * 3600_000, data: product });
    console.debug('stored product', product.id);

    this.writePromise = this.writePromise.then(() =>
      writeFile('/tmp/cache/product-cache.json', JSON.stringify(Array.from(this.productCache.entries())))
    );
  }

  public getSearch(searchTerm: string): SearchResultItemWithoutTracking[] | null {
    const entry = this.searchCache.get(searchTerm);
    if (!entry) {
      console.debug('Cache miss for search', searchTerm);
      return null;
    }
    if (entry.expires < Date.now()) {
      console.debug('Cache expired for search', searchTerm);
      this.searchCache.delete(searchTerm);
      return null;
    }
    console.debug('Cache hit for search', searchTerm);
    return entry.data;
  }

  public storeSearch(searchTerm: string, search: SearchResultItem[]): void {
    this.searchCache.set(searchTerm, { expires: Date.now() + 48 * 3600_000, data: search });
    console.debug('stored search', searchTerm);

    this.writePromise = this.writePromise.then(() =>
      writeFile('/tmp/cache/search-cache.json', JSON.stringify(Array.from(this.searchCache.entries())))
    );
  }
}
