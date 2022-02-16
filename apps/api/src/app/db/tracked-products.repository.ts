import { Injectable } from '@nestjs/common';
import { WithoutId } from 'mongodb';
import { Product } from '@shoppi/api-interfaces';
import { Config } from '../config';
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

@Injectable()
export class TrackedProductsRepository {
  private repo: Repository<TrackedProducts>;

  constructor(config: Config) {
    this.repo = new Repository(config, 'productGroups');
  }

  public async save(trackingId: string | null, product: Product): Promise<{ trackingId: string }> {
    const existingEntryForProduct = await this.repo.db.findOne({ 'products.productId': product.id });
    if (existingEntryForProduct) {
      return { trackingId: existingEntryForProduct._id.toString() };
    }

    console.log('FINDING ONE', trackingId);

    const existingTrackingEntry: TrackedProducts | null = trackingId ? await this.repo.findOne(trackingId) : null;

    console.log('FINDING xxx', existingTrackingEntry);

    if (trackingId && existingTrackingEntry) {
      const updatedEntry: TrackedProducts = {
        ...existingTrackingEntry,
        products: this.getOrCreateProductEntry(existingTrackingEntry.products, product),
        createdAt: existingTrackingEntry.createdAt,
        updatedAt: new Date(),
      };
      const result = await this.repo.update(updatedEntry);
      console.log('Updating', result);
      return { trackingId };
    } else {
      const newEntry: WithoutId<TrackedProducts> = {
        products: this.getOrCreateProductEntry([], product),
        name: product.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await this.repo.create(newEntry as TrackedProducts);
      console.log('Creating', result);
      return {
        trackingId: result._id.toString(),
      };
    }
  }

  public async getAllTrackedIds(): Promise<string[]> {
    return (await this.repo.findAll())
      .sort((a, b) => a.createdAt.getDate() - b.createdAt.getDate())
      .reduce((acc, curr) => acc.concat(curr.products.map(({ productId }) => productId)), [] as string[]);
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
