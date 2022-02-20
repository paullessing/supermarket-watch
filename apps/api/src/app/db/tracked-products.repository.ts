import { Injectable } from '@nestjs/common';
import { Filter, WithoutId } from 'mongodb';
import { Config } from '../config';
import { Product } from '../product.model';
import { Repository } from './repository';
import { TimestampedDocument } from './timestamped-document';

interface TrackedProduct {
  productId: string;
  product: Product;
  history: {
    date: Date;
    product: Product;
  }[];
}

interface TrackedProducts extends TimestampedDocument {
  name: string;
  products: TrackedProduct[];
}

type ArrayType<T> = T extends (infer U)[] ? U : never;

@Injectable()
export class TrackedProductsRepository {
  private repo: Repository<TrackedProducts>;

  constructor(config: Config) {
    this.repo = new Repository(config, 'productGroups');
  }

  public async getProduct(productId: string, updatedAfter?: Date): Promise<Product | null> {
    const query: Filter<TrackedProducts> = {
      'products.productId': productId,
    };
    if (updatedAfter) {
      query['updatedAt'] = { $gte: updatedAfter };
    }
    const trackedProductEntry = await this.repo.db.findOne<TrackedProducts>(query);
    return trackedProductEntry?.products.find((product) => product.productId === productId)?.product || null;
  }

  public async createTrackingOrAddToExisting(
    trackingId: string | null,
    product: Product
  ): Promise<{ trackingId: string }> {
    console.debug('Creating tracking. Existing ID:', trackingId, 'Product:', product);
    const existingEntryForProduct = await this.repo.db.findOne({ 'products.productId': product.id });
    if (existingEntryForProduct) {
      console.debug('Tracking for this product already exists:', existingEntryForProduct._id.toString());
      return { trackingId: existingEntryForProduct._id.toString() };
    }

    console.debug((trackingId ? '' : 'Not') + 'Looking up by TrackingId', trackingId);
    const existingTrackingEntry: TrackedProducts | null = trackingId ? await this.repo.findOne(trackingId) : null;
    console.debug('Existing entry:', existingTrackingEntry);

    if (trackingId && existingTrackingEntry) {
      const updatedEntry: TrackedProducts = {
        ...existingTrackingEntry,
        products: this.getOrCreateProductEntry(existingTrackingEntry.products, product),
        createdAt: existingTrackingEntry.createdAt,
        updatedAt: new Date(),
      };
      const result = await this.repo.update(updatedEntry);
      console.debug('Updating', result);
      return { trackingId };
    } else {
      const newEntry: WithoutId<TrackedProducts> = {
        products: this.getOrCreateProductEntry([], product),
        name: product.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await this.repo.create(newEntry as TrackedProducts);
      console.debug('Creating', result);
      return {
        trackingId: result._id.toString(),
      };
    }
  }

  public async addToHistory(products: Product[]): Promise<void> {
    const now = new Date();

    const entries = await this.repo.db
      .find({
        'products.productId': { $in: products.map((pproduct) => pproduct.id) },
      })
      .toArray();

    for (const entry of entries) {
      const updatedEntry: TrackedProducts = {
        ...entry,
        updatedAt: now,
        products: entry.products.map((productEntry) => {
          const product = products.find((p) => p.id === productEntry.productId);
          if (product) {
            const historyEntry: ArrayType<TrackedProduct['history']> = {
              date: now,
              product: product,
            };
            return {
              ...productEntry,
              history: [historyEntry, ...productEntry.history],
            };
          } else {
            return productEntry;
          }
        }),
      };
      await this.repo.update(updatedEntry);
    }
  }

  public async getAllTrackedIds(): Promise<string[]> {
    return (await this.repo.findAll())
      .sort((a, b) => a.createdAt.getDate() - b.createdAt.getDate())
      .reduce((acc, curr) => acc.concat(curr.products.map(({ productId }) => productId)), [] as string[]);
  }

  /**
   * Returns all tracked products from the set of IDs. The result is a map of itemId => trackedId.
   */
  public async getTrackedIds(itemIds: string[]): Promise<Map<string, string>> {
    const filter: Filter<TrackedProducts> = {
      products: {
        $elemMatch: {
          productId: {
            $in: itemIds,
          },
        },
      },
    };
    console.log('Filter:', JSON.stringify(filter));

    const trackedItems = await this.repo.db
      .aggregate<{ _id: string; productId: string }>([
        {
          $match: {
            products: {
              $elemMatch: {
                productId: {
                  $in: itemIds,
                },
              },
            },
          },
        },
        { $unwind: '$products' },
        {
          $project: { productId: '$products.productId' },
        },
      ])
      .toArray();

    return new Map(trackedItems.map(({ productId, _id }) => [productId, _id]));
  }

  public async removeAll(): Promise<void> {
    await this.repo.db.deleteMany({});
  }

  public async search(searchTerm: string): Promise<TrackedProducts[]> {
    const result = this.repo.db.find({ 'products.product.name': { $regex: searchTerm, $options: '$i' } });

    return result.toArray();
  }

  private getOrCreateProductEntry(trackedProducts: TrackedProduct[], product: Product): TrackedProduct[] {
    const existingProduct = trackedProducts.find(({ productId }) => productId === product.id);
    const historyEntry = { product, date: new Date() };
    const newEntry: TrackedProduct = {
      ...existingProduct,
      productId: product.id,
      product,
      history: [historyEntry, ...(existingProduct?.history || [])],
    };

    if (existingProduct) {
      return trackedProducts.map((_product) => (_product.productId === product.id ? newEntry : _product));
    } else {
      return [...trackedProducts, newEntry];
    }
  }
}
