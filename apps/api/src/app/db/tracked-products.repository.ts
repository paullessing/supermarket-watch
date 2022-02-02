import { Injectable } from '@nestjs/common';
import { WithoutId } from 'mongodb';
import { Config } from '../config';
import { Repository } from './repository';
import { TimestampedDocument } from './timestamped-document';

interface TrackedProduct {
  productId: string;
}

interface TrackedProducts extends TimestampedDocument {
  products: TrackedProduct[];
}

@Injectable()
export class TrackedProductsRepository {
  private repo: Repository<TrackedProducts>;

  constructor(config: Config) {
    this.repo = new Repository(config, 'productGroups');
  }

  public async save(trackingId: string | null, productId: string): Promise<{ trackingId: string }> {
    const existingEntryForProduct = await this.repo.db.findOne({ 'products.productId': productId });
    if (existingEntryForProduct) {
      return { trackingId: existingEntryForProduct._id };
    }

    const existingTrackingEntry: Partial<TrackedProducts> = (trackingId && (await this.repo.findOne(trackingId))) || {};

    const updatedEntry: WithoutId<TrackedProducts> = {
      products: [...(existingTrackingEntry?.products ?? []), { productId }],
      createdAt: existingTrackingEntry?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (trackingId) {
      await this.repo.db.updateOne({ _id: trackingId }, { $set: updatedEntry }, { upsert: true });
      return { trackingId };
    } else {
      const result = await this.repo.create(updatedEntry as TrackedProducts);
      return {
        trackingId: result._id,
      };
    }
  }
}
