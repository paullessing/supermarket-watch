import { Inject, Injectable } from '@nestjs/common';
import { differenceInMinutes } from 'date-fns';
import { Collection, Filter, ObjectId, WithoutId } from 'mongodb';
import { NOW } from '../now';
import { Product } from '../product.model';
import { HISTORY_COLLECTION, TRACKING_COLLECTION } from './db.providers';
import { EntityNotFoundError } from './entity-not-found.error';
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
    @Inject(HISTORY_COLLECTION) private readonly history: Collection<ProductHistory>,
    @Inject(NOW) private readonly now: Date
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

  public async addOrCreateTracking(trackingId: string | undefined | null, product: Product): Promise<string> {
    const existingEntryForProduct = await this.products.findOne({ 'products.product.id': product.id });
    if (existingEntryForProduct) {
      console.debug('Tracking for this product already exists:', existingEntryForProduct._id.toString());
      throw new Error('Tracking for this product already exists');
    }

    let resultTrackingId: string;
    if (trackingId) {
      resultTrackingId = await this.addProductToTrackingEntry(trackingId, product);
    } else {
      resultTrackingId = await this.createNewTrackingEntry(product);
    }

    await this.addProductToHistory(product);

    return resultTrackingId;
  }

  public async updateCurrentProducts(trackingId: string, updatedProducts: Product[]): Promise<void> {
    const trackedProducts = await this.products.findOne({
      _id: toId(trackingId),
    } as Filter<TrackedProducts>);
    console.debug('Existing entry:', trackedProducts);

    if (!trackedProducts) {
      throw new Error('Tracking does not exist');
    }

    await this.updateProducts(trackedProducts, updatedProducts);

    await Promise.all(updatedProducts.map((product) => this.addProductToHistory(product)));
  }

  public async addToHistory(product: Product): Promise<void> {
    await this.addProductToHistory(product);

    const trackedProducts = await this.products.findOne({
      'products.product.id': product.id,
    });
    if (trackedProducts) {
      await this.updateProducts(trackedProducts, [product]);
    }
  }

  public async getAllTrackedProducts(): Promise<
    {
      id: string;
      name: string;
      products: Product[];
    }[]
  > {
    const trackedProducts = await this.products.find({}).toArray();
    return trackedProducts.map(({ _id, name, products }) => ({
      id: _id.toString(),
      name,
      products: products.map(({ product }) => product),
    }));
  }

  public async getOutdatedProductIds(updatedAfter: Date): Promise<string[]> {
    const trackedProducts = await this.products
      .find({
        'products.lastUpdated': {
          $lt: updatedAfter,
        },
      })
      .toArray();

    function getOutdatedProductIds(trackedProduct: TrackedProducts): string[] {
      return trackedProduct.products
        .filter(({ lastUpdated }) => lastUpdated < updatedAfter)
        .map(({ product }) => product.id);
    }

    return trackedProducts.map(getOutdatedProductIds).reduce((acc, curr) => acc.concat(...curr), [] as string[]);
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
    const trackedItems = await this.products
      .aggregate<{ _id: string; productId: string }>([
        {
          $match: {
            products: {
              $elemMatch: {
                'product.id': {
                  $in: itemIds,
                },
              },
            },
          },
        },
        { $unwind: '$products' },
        {
          $project: { productId: '$products.product.id' },
        },
      ])
      .toArray();

    return new Map(trackedItems.map(({ productId, _id }) => [productId, _id]));
  }

  public async removeTrackedProduct(trackingId: string): Promise<void> {
    await this.products.deleteOne({ _id: toId(trackingId) });
  }

  public async removeProductFromTrackingGroup(trackingId: string, productId: string): Promise<void> {
    const trackedProducts = await this.products.findOne({
      _id: toId(trackingId),
    } as Filter<TrackedProducts>);

    if (!trackedProducts) {
      throw new Error('Tracking does not exist');
    }

    const updatedProducts = trackedProducts.products.filter(({ product }) => product.id !== productId);

    await this.products.updateOne(
      { _id: toId(trackingId) },
      {
        $set: {
          products: updatedProducts,
        },
      }
    );
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

  public async getHistory(productId: string): Promise<{ date: Date; price: number; pricePerUnit: number }[]> {
    const historyData = await this.history.findOne({ productId });
    if (!historyData) {
      throw new EntityNotFoundError(productId);
    }
    return historyData.history.map(({ date, product: { price, pricePerUnit } }) => ({ date, price, pricePerUnit }));
  }

  private async updateProducts(trackedProducts: TrackedProducts, updatedProducts: Product[]): Promise<void> {
    const products = updatedProducts.map((updatedProduct) => {
      const existingProduct = trackedProducts.products.find(({ product }) => product.id === updatedProduct.id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }
      if (existingProduct.lastUpdated > this.now) {
        return existingProduct; // Don't use older data
      }
      return {
        product: updatedProduct,
        lastUpdated: this.now,
      };
    });

    const result = await this.products.updateOne(
      { _id: trackedProducts._id },
      {
        $set: {
          products,
          lastUpdated: this.now,
        },
      }
    );
    console.debug('Updated', result);
  }

  private async addProductToHistory(product: Product): Promise<void> {
    const entry = await this.history.findOne({
      productId: product.id,
    });

    if (entry) {
      const updatedEntry: Partial<ProductHistory> = {
        history: this.addHistoryEntry(entry.history, product),
        updatedAt: this.now,
      };
      console.debug('Updating history entry', updatedEntry);
      await this.history.updateOne({ _id: toId(entry._id) }, { $set: updatedEntry });
    } else {
      const newEntry: WithoutId<ProductHistory> = {
        productId: product.id,
        history: this.addHistoryEntry([], product),
        createdAt: this.now,
        updatedAt: this.now,
      };
      console.debug('Creating history entry', newEntry);
      await this.history.insertOne(newEntry as ProductHistory);
    }
  }

  private addHistoryEntry(history: HistoryEntry[], product: Product): HistoryEntry[] {
    const newEntry: HistoryEntry = {
      date: this.now,
      product,
    };
    for (let i = 0; i < history.length; i++) {
      if (Math.abs(differenceInMinutes(this.now, history[i].date)) < 5) {
        // Don't create closely-spaced history entries
        history[i] = newEntry;
        return history;
      }
      if (history[i].date.getTime() < this.now.getTime()) {
        const copy = history.slice();
        copy.splice(i, 0, newEntry);
        return copy;
      }
    }
    return [...history, newEntry];
  }

  private async addProductToTrackingEntry(trackingId: string, product: Product): Promise<string> {
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
            lastUpdated: this.now,
          },
        },
        $set: {
          updatedAt: this.now,
        },
      }
    );
    return trackingId;
  }

  private async createNewTrackingEntry(product: Product): Promise<string> {
    const result = await this.products.insertOne({
      name: product.name,
      products: [{ product, lastUpdated: this.now }],
      createdAt: this.now,
      updatedAt: this.now,
    } as TrackedProducts);
    return result.insertedId.toString();
  }
}

function toId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id;
}
