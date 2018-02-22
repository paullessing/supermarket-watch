import { Product } from './product';

export abstract class Supermarket {
  public async init(): Promise<void> {}
  public abstract getProduct(id: string): Promise<Product | null>;
}
