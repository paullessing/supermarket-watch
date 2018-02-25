import { Product } from '../models/product.model';

export abstract class Supermarket {

  public async init(): Promise<void> {}

  public abstract getProduct(id: string): Promise<Product | null>;

  public async getProducts(ids: string[]): Promise<(Product | null)[]> {
    return await Promise.all(ids.map(id => this.getProduct(id)));
  }
}
