import { Inject, Injectable } from '@nestjs/common';
import { differenceInMinutes } from 'date-fns';
import { Collection, Filter, ObjectId, ReturnDocument, WithoutId } from 'mongodb';
import { HistoricalProduct, TrackedItemGroup } from '@shoppi/api-interfaces';
import { ConversionService } from '../conversion.service';
import { Product } from '../product.model';
import { unique } from '../util';
import { HISTORY_COLLECTION, TRACKING_COLLECTION } from './db.providers';
import { EntityNotFoundError } from './entity-not-found.error';
import { TimestampedDocument } from './timestamped-document';

interface TrackedProducts extends TimestampedDocument {
  name: string;
  unitName: string;
  unitAmount: number;
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
    private readonly conversionService: ConversionService
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

  public async createTracking(product: Product, unit: string, unitAmount: number, now: Date): Promise<string> {
    const existingEntryForProduct = await this.products.findOne({ 'products.product.id': product.id });
    if (existingEntryForProduct) {
      console.debug('Tracking for this product already exists:', existingEntryForProduct._id.toString());
      throw new Error('Tracking for this product already exists');
    }

    const resultTrackingId = await this.createNewTrackingEntry(product, unit, unitAmount, now);

    await this.addProductToHistory(product, now);

    return resultTrackingId;
  }

  public async addToTracking(trackingId: string, product: Product, now: Date): Promise<string> {
    const existingEntryForProduct = await this.products.findOne({ 'products.product.id': product.id });
    if (existingEntryForProduct) {
      console.debug('Tracking for this product already exists:', existingEntryForProduct._id.toString());
      throw new Error('Tracking for this product already exists');
    }

    const resultTrackingId = await this.addProductToTrackingEntry(trackingId, product, now);

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

  public async updateProduct(trackingId: string, { name }: { name?: string }): Promise<TrackedItemGroup> {
    const updates: Partial<TrackedProducts> = {};
    if (name) {
      updates.name = name;
    }

    if (!Object.keys(updates).length) {
      throw new Error('No updates provided');
    }

    const { ok, value } = await this.products.findOneAndUpdate(
      { _id: toId(trackingId) },
      { $set: updates },
      { returnDocument: ReturnDocument.AFTER }
    );

    if (!ok || !value) {
      throw new Error('Tracking does not exist');
    }

    return this.convertToTrackedItemGroup(value);
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

  public async getAllTrackedProducts(): Promise<TrackedItemGroup[]> {
    const trackedProducts = await this.products.find({}).toArray();
    return trackedProducts.map(({ _id, name, products, unitName, unitAmount }) => {
      return {
        id: _id.toString(),
        name,
        unitName,
        unitAmount,
        products: products.map(({ product }) => ({
          ...product,
          pricePerUnit: this.conversionService.convert(
            product.pricePerUnit,
            {
              unit: product.unitName,
              unitAmount: product.unitAmount,
            },
            {
              unit: unitName,
              unitAmount,
            }
          ),
        })),
      };
    });
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
    const [fuzzyResults, regexResults] = await Promise.all([
      this.products
        .find({
          $text: { $search: searchTerm, $caseSensitive: false, $language: 'english' },
        })
        .toArray(),
      this.products
        .find({
          $or: [
            { 'products.product.name': { $regex: searchTerm, $options: '$i' } },
            { name: { $regex: searchTerm, $options: '$i' } },
          ],
        })
        .toArray(),
    ]);

    return [...fuzzyResults, ...regexResults].filter(unique(({ _id }) => _id.toString()));
  }

  public async getHistory(productId: string): Promise<{ date: Date; price: number; pricePerUnit: number }[]> {
    const historyData = await this.history.findOne({ productId });
    if (!historyData) {
      throw new EntityNotFoundError(productId);
    }
    return historyData.history.map(({ date, product: { price, pricePerUnit } }) => ({ date, price, pricePerUnit }));
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

  private async createNewTrackingEntry(
    product: Product,
    unitName: string,
    unitAmount: number,
    now: Date
  ): Promise<string> {
    const result = await this.products.insertOne({
      name: product.name,
      unitName,
      unitAmount,
      products: [{ product, lastUpdated: now }],
      createdAt: now,
      updatedAt: now,
    } as TrackedProducts);
    return result.insertedId.toString();
  }

  private convertToTrackedItemGroup(value: TrackedProducts): TrackedItemGroup {
    return {
      id: value._id.toString(),
      name: value.name,
      unitName: value.unitName,
      unitAmount: value.unitAmount,
      products: value.products.map(
        ({ product }): HistoricalProduct => ({
          id: product.id,
          name: product.name,
          price: product.price,
          pricePerUnit: product.pricePerUnit,
          supermarket: product.supermarket,
          specialOffer: product.specialOffer,
        })
      ),
    };
  }
}

function toId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id;
}
