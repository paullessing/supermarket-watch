import { Product, SearchResult } from '@shoppi/api-interfaces';

export const Supermarkets = 'Supermarkets';

export abstract class Supermarket {
  public abstract getPrefix(): string;

  protected getId(internalId: string): string {
    return `${this.getPrefix()}:${internalId}`;
  }

  public abstract getProduct(id: string): Promise<Product | null>;

  public async getProducts(ids: string[]): Promise<(Product | null)[]> {
    return await Promise.all(ids.map((id) => this.getProduct(id)));
  }

  public abstract search(term: string): Promise<SearchResult>;
}
