import { Injectable } from '@nestjs/common';
import { Collection, Filter, MongoClient, ObjectId, WithoutId } from 'mongodb';
import { Product } from '../product.model';
import { TimestampedDocument } from './timestamped-document';

interface TrackedProducts extends TimestampedDocument {
  name: string;
  products: Product[];
  productsLastUpdated: Date;
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
  private products!: Collection<TrackedProducts>;
  private history!: Collection<ProductHistory>;

  private readonly initialised: Promise<void>;

  constructor() {
    const client = new MongoClient('mongodb://mongo:27017');

    this.initialised = client.connect().then(async () => {
      console.log('TPReg: Connected successfully to the server');
      const db = client.db('shopping');
      this.products = db.collection('trackedProducts');
      this.history = db.collection('productHistory');
      await Promise.all([
        this.products.createIndex(
          {
            'products.id': 1,
          },
          {
            unique: true,
            sparse: false,
          }
        ),
        this.history.createIndex(
          {
            productId: 1,
          },
          {
            unique: true,
            sparse: false,
          }
        ),
      ]);
    });
  }

  public async getProduct(productId: string, updatedAfter?: Date): Promise<Product | null> {
    await this.initialised;

    const query: Filter<TrackedProducts> = {
      'products.id': productId,
    };
    if (updatedAfter) {
      query['productsLastUpdated'] = { $gte: updatedAfter };
    }
    const trackedProductEntry = await this.products.findOne(query);
    return trackedProductEntry?.products.find((product) => product.id === productId) ?? null;
  }

  public async getProductIds(trackingId: string): Promise<string[]> {
    await this.initialised;

    const trackedProduct = await this.products.findOne({ _id: toId(trackingId) });
    if (!trackedProduct) {
      return [];
    }
    return trackedProduct.products.map((product) => product.id) ?? [];
  }

  public async createTracking(product: Product): Promise<string> {
    await this.initialised;

    const existingEntryForProduct = await this.products.findOne({ 'products.productId': product.id });
    if (existingEntryForProduct) {
      console.debug('Tracking for this product already exists:', existingEntryForProduct._id.toString());
      throw new Error('Tracking for this product already exists');
    }

    const now = new Date();
    const result = await this.products.insertOne({
      name: product.name,
      products: [product],
      productsLastUpdated: now,
      createdAt: now,
      updatedAt: now,
    } as TrackedProducts);
    const trackingId = result.insertedId.toString();

    await this.addToHistory(product);

    return trackingId;
  }

  public async addToTrackedProduct(trackingId: string, updatedProducts: Product[], newProduct: Product): Promise<void> {
    await this.initialised;

    console.debug('Creating tracking. Existing ID:', trackingId, 'Product:', newProduct);
    const existingEntryForProduct = await this.products.findOne({ 'products.productId': newProduct.id });
    if (existingEntryForProduct) {
      console.debug('Tracking for this product already exists:', existingEntryForProduct._id.toString());
      throw new Error('Tracking for this product already exists');
    }

    const existingTrackingEntry: TrackedProducts | null = await this.products.findOne({
      _id: toId(trackingId),
    } as Filter<TrackedProducts>);
    console.debug('Existing entry:', existingTrackingEntry);

    if (!existingTrackingEntry) {
      throw new Error('Tracking does not exist');
    }

    const products = [...existingTrackingEntry.products, newProduct];

    const trackedProducts = {
      ...existingTrackingEntry,
      products,
    };

    await this.updateProducts(trackedProducts, products);
  }

  public async updateCurrentProducts(trackingId: string, updatedProducts: Product[]): Promise<void> {
    await this.initialised;

    const trackedProducts = await this.products.findOne({
      _id: toId(trackingId),
    } as Filter<TrackedProducts>);
    console.debug('Existing entry:', trackedProducts);

    if (!trackedProducts) {
      throw new Error('Tracking does not exist');
    }

    await this.updateProducts(trackedProducts, updatedProducts);
  }

  public async addToHistory(product: Product): Promise<void> {
    await this.initialised;

    return this.addProductToHistory(product, new Date());
  }

  public async getAllTrackedIds(): Promise<string[]> {
    await this.initialised;

    return (await this.products.find({}).toArray())
      .sort((a, b) => a.createdAt.getDate() - b.createdAt.getDate())
      .reduce((acc, curr) => acc.concat(curr.products.map(({ id }) => id)), [] as string[]);
  }

  /**
   * Returns all tracked products from the set of IDs. The result is a map of itemId => trackedId.
   */
  public async getTrackedIds(itemIds: string[]): Promise<Map<string, string>> {
    await this.initialised;

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
    await this.initialised;

    await this.products.deleteMany({});
  }

  /**
   * Debug method only
   */
  public async removeAllHistory(): Promise<void> {
    await this.initialised;

    await this.history.deleteMany({});
  }

  public async search(searchTerm: string): Promise<TrackedProducts[]> {
    await this.initialised;

    const result = this.products.find({ 'products.name': { $regex: searchTerm, $options: '$i' } });

    return result.toArray();
  }

  private async updateProducts(trackedProducts: TrackedProducts, updatedProducts: Product[]): Promise<void> {
    const existingIds = trackedProducts.products.map((product) => product.id);
    const newIds = updatedProducts.map((product) => product.id);
    if (existingIds.sort().join(',') !== newIds.sort().join(',')) {
      console.error('Product ID mismatch, expected:', existingIds.sort().join(','), 'got:', newIds.sort().join(','));
      throw new Error('Product IDs do not match');
    }

    const products = trackedProducts.products.map(
      (product) => updatedProducts.find((updatedProduct) => updatedProduct.id === product.id)! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    );

    const now = new Date();
    const updatedEntry: TrackedProducts = {
      ...trackedProducts,
      products,
      productsLastUpdated: now,
      updatedAt: now,
    };
    const result = await this.products.updateOne({ _id: trackedProducts._id }, { $set: updatedEntry });
    console.debug('Updated', result);

    console.debug('Updating history');
    await updatedProducts.forEach((product) => this.addProductToHistory(product, now));
  }

  private async addProductToHistory(product: Product, now: Date): Promise<void> {
    const entry = await this.history.findOne({
      productId: product.id,
    });

    if (entry) {
      const updatedEntry: ProductHistory = {
        ...entry,
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
      if (history[i].date.getTime() === now.getTime()) {
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
}

function toId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id;
}
