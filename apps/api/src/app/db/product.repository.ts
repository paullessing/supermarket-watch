import { Injectable } from '@nestjs/common';
import { Product } from '@shoppi/api-interfaces';
import { Config } from '../config';
import { TimestampedDocument } from './timestamped-document';
import { Repository } from './repository';

interface ProductEntry extends TimestampedDocument {
  productId: string;
  product: Product;
  history: {
    date: Date;
    product: Product;
  }[];
}

@Injectable()
export class ProductRepository {

  private repo: Repository<ProductEntry>;

  constructor(
    config: Config,
  ) {
    this.repo = new Repository(config, 'products');
    // According to the docs, this method is actually synchronous
    this.repo.initialised.then(() => {
      return this.repo.db.createIndex({
        productId: 1,
      }, {
        unique: true,
        sparse: false,
      });
    })
  }

  public async get(productId: string, updatedAfter?: Date): Promise<Product | null> {
    const query = {
      productId,
    };
    if (updatedAfter) {
      query['updatedAt'] = { $gte: updatedAfter };
    }
    const item = await this.repo.db.findOne<ProductEntry>(query);
    return item?.product || null;
  }

  public async getHistory(productId: string): Promise<{ date: Date, price: number, pricePerUnit: number }[]> {
    const item = await this.repo.db.findOne<ProductEntry>({ productId });

    return (item?.history || []).map(({ date, product: { price, pricePerUnit } }) => ({ date, price, pricePerUnit }));
  }

  public async save(product: Product): Promise<Product> {
    const existingEntry = await this.repo.db.findOne<ProductEntry>({ productId: product.id });

    const newEntity: ProductEntry = {
      ...existingEntry,
      productId: product.id,
      product,
      history: [{ product, date: new Date() }, ...(existingEntry?.history || [])],
      createdAt: existingEntry?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    await this.repo.db.updateOne(
      { productId: product.id },
      { $set: newEntity },
      { upsert: true }
    );

    return product;
  }
}
