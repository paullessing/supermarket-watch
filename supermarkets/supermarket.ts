import { Product } from '../models/product.model';
import { SearchResult } from '../models/search-result.model';

export abstract class Supermarket {

  public abstract getProduct(id: string): Promise<Product | null>;

  public async getProducts(ids: string[]): Promise<(Product | null)[]> {
    return await Promise.all(ids.map(id => this.getProduct(id)));
  }

  public abstract search(term: string): Promise<SearchResult>;
}
