import { Injectable } from '@nestjs/common';
import { Product } from '@shoppi/api-interfaces';
import { Config } from '../config';
import { InsertQuery, NedbTimestampedDocument } from './nedb-document';
import { Repository } from './repository';

interface ProductEntry extends NedbTimestampedDocument {
  productId: string;
  product: Product;
}

@Injectable()
export class ProductRepository {

  private repo: Repository<ProductEntry>;

  constructor(
    config: Config,
  ) {
    this.repo = new Repository(config, 'products.db', { timestampData: true });
    // According to the docs, this method is actually synchronous
    this.repo.db.ensureIndex({
      fieldName: 'productId',
      unique: true,
      sparse: false,
    });
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

  public async save(product: Product): Promise<Product> {
    const newEntity: InsertQuery<ProductEntry> = {
      productId: product.id,
      product
    };
    await this.repo.db.update<ProductEntry>(
      { productId: product.id },
      newEntity,
      { upsert: true }
    );

    return product;
  }
}
