import { Inject, Injectable } from '@nestjs/common';
import { differenceInMinutes } from 'date-fns';
import { Collection, Filter, ObjectId, WithoutId } from 'mongodb';
import { Product } from '../product.model';
import { HISTORY_COLLECTION, TRACKING_COLLECTION } from './db.providers';
import { TimestampedDocument } from './timestamped-document';

interface TrackedProducts extends TimestampedDocument {
  name: string;
  products: {
    product: Product;
    lastUpdated: Date;
  }[];
}

interface HistoryEntry {
  date: Date;
  product: Product;
}

interface ProductHistory extends TimestampedDocument {
  productId: string;
  history: HistoryEntry[];
}

@Injectable()
export class TrackedProductsRepository {
  constructor(
    @Inject(TRACKING_COLLECTION) private readonly products: Collection<TrackedProducts>,
    @Inject(HISTORY_COLLECTION) private readonly history: Collection<ProductHistory>
  ) {}

  public async getProduct(productId: string, updatedAfter?: Date): Promise<Product | null> {
    const query: Filter<TrackedProducts> = {
      products: {
        $elemMatch: {
          ...{
            id: productId,
          },
          ...(updatedAfter
            ? {
                lastUpdated: {
                  $gte: updatedAfter,
                },
              }
            : {}),
        },
      },
    };
    const trackedProductEntry = await this.products.findOne(query);
    return trackedProductEntry?.products.find(({ product }) => product.id === productId)?.product ?? null;
  }

  public async getProductIds(trackingId: string): Promise<string[]> {
    const trackedProduct = await this.products.findOne({ _id: toId(trackingId) });
    if (!trackedProduct) {
      return [];
    }
    return trackedProduct.products.map(({ product }) => product.id) ?? [];
  }

  public async addOrCreateTracking(
    trackingId: string | undefined | null,
    product: Product,
    now: Date
  ): Promise<string> {
    const existingEntryForProduct = await this.products.findOne({ 'products.product.id': product.id });
    if (existingEntryForProduct) {
      console.debug('Tracking for this product already exists:', existingEntryForProduct._id.toString());
      throw new Error('Tracking for this product already exists');
    }

    let resultTrackingId: string;
    if (trackingId) {
      resultTrackingId = await this.addProductToTrackingEntry(trackingId, product, now);
    } else {
      resultTrackingId = await this.createNewTrackingEntry(product, now);
    }

    await this.addProductToHistory(product, now);

    return resultTrackingId;
  }

  public async updateCurrentProducts(trackingId: string, updatedProducts: Product[], now: Date): Promise<void> {
    const trackedProducts = await this.products.findOne({
      _id: toId(trackingId),
    } as Filter<TrackedProducts>);
    console.debug('Existing entry:', trackedProducts);

    if (!trackedProducts) {
      throw new Error('Tracking does not exist');
    }

    await this.updateProducts(trackedProducts, updatedProducts, now);

    await Promise.all(updatedProducts.map((product) => this.addProductToHistory(product, now)));
  }

  public async addToHistory(product: Product, now: Date): Promise<void> {
    await this.addProductToHistory(product, now);

    const trackedProducts = await this.products.findOne({
      'products.product.id': product.id,
    });
    if (trackedProducts) {
      await this.updateProducts(trackedProducts, [product], now);
    }
  }

  public async getAllTrackedIds(): Promise<string[]> {
    return (await this.products.find({}).toArray())
      .sort((a, b) => a.createdAt.getDate() - b.createdAt.getDate())
      .reduce((acc, curr) => acc.concat(curr.products.map(({ product: { id } }) => id)), [] as string[]);
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
    console.debug('Filter:', JSON.stringify(filter));

    const trackedItems = await this.products
      .aggregate<{ _id: string; productId: string }>([
        {
          $match: {
            products: {
              $elemMatch: {
                id: {
                  $in: itemIds,
                },
              },
            },
          },
        },
        { $unwind: '$products' },
        {
          $project: { productId: '$products.id' },
        },
      ])
      .toArray();

    return new Map(trackedItems.map(({ productId, _id }) => [productId, _id]));
  }

  /**
   * Debug method only
   */
  public async removeAllTrackedProducts(): Promise<void> {
    await this.products.deleteMany({});
  }

  /**
   * Debug method only
   */
  public async removeAllHistory(): Promise<void> {
    await this.history.deleteMany({});
  }

  public async search(searchTerm: string): Promise<TrackedProducts[]> {
    const result = this.products.find({
      $or: [
        { 'products.product.name': { $regex: searchTerm, $options: '$i' } },
        { name: { $regex: searchTerm, $options: '$i' } },
      ],
    });

    return result.toArray();
  }

  private async updateProducts(trackedProducts: TrackedProducts, updatedProducts: Product[], now: Date): Promise<void> {
    const products = updatedProducts.map((updatedProduct) => {
      const existingProduct = trackedProducts.products.find(({ product }) => product.id === updatedProduct.id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }
      if (existingProduct.lastUpdated > now) {
        return existingProduct; // Don't use older data
      }
      return {
        product: updatedProduct,
        lastUpdated: now,
      };
    });

    const result = await this.products.updateOne(
      { _id: trackedProducts._id },
      {
        $set: {
          products,
          lastUpdated: now,
        },
      }
    );
    console.debug('Updated', result);
  }

  private async addProductToHistory(product: Product, now: Date): Promise<void> {
    const entry = await this.history.findOne({
      productId: product.id,
    });

    if (entry) {
      const updatedEntry: Partial<ProductHistory> = {
        history: this.addHistoryEntry(entry.history, product, now),
        updatedAt: now,
      };
      console.debug('Updating history entry', updatedEntry);
      await this.history.updateOne({ _id: toId(entry._id) }, { $set: updatedEntry });
    } else {
      const newEntry: WithoutId<ProductHistory> = {
        productId: product.id,
        history: this.addHistoryEntry([], product, now),
        createdAt: now,
        updatedAt: now,
      };
      console.debug('Creating history entry', newEntry);
      await this.history.insertOne(newEntry as ProductHistory);
    }
  }

  private addHistoryEntry(history: HistoryEntry[], product: Product, now: Date): HistoryEntry[] {
    const newEntry: HistoryEntry = {
      date: now,
      product,
    };
    for (let i = 0; i < history.length; i++) {
      if (Math.abs(differenceInMinutes(now, history[i].date)) < 5) {
        // Don't create closely-spaced history entries
        history[i] = newEntry;
        return history;
      }
      if (history[i].date.getTime() < now.getTime()) {
        const copy = history.slice();
        copy.splice(i, 0, newEntry);
        return copy;
      }
    }
    return [...history, newEntry];
  }

  private async addProductToTrackingEntry(trackingId: string, product: Product, now: Date): Promise<string> {
    const existingTrackingEntry = await this.products.findOne({
      _id: toId(trackingId),
    } as Filter<TrackedProducts>);

    if (!existingTrackingEntry) {
      throw new Error('Tracking ID does not exist');
    }
    console.debug('Existing entry:', existingTrackingEntry);

    await this.products.updateOne(
      {
        _id: toId(trackingId),
      } as Filter<TrackedProducts>,
      {
        $push: {
          products: {
            product,
            lastUpdated: now,
          },
        },
        $set: {
          updatedAt: now,
        },
      }
    );
    return trackingId;
  }

  private async createNewTrackingEntry(product: Product, now: Date): Promise<string> {
    const result = await this.products.insertOne({
      name: product.name,
      products: [{ product, lastUpdated: now }],
      createdAt: now,
      updatedAt: now,
    } as TrackedProducts);
    return result.insertedId.toString();
  }
}

function toId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id;
}
