import { SearchResult, SearchResultItem } from '@shoppi/api-interfaces';
import { SupermarketProduct } from './supermarket-product.model';

export const Supermarkets = 'Supermarkets';

export type SearchResultItemWithoutTracking = Omit<SearchResultItem, 'trackingId'>;
export type SearchResultWithoutTracking = Omit<SearchResult, 'items'> & {
  items: SearchResultItemWithoutTracking[];
};

export abstract class Supermarket {
  public abstract getPrefix(): string;

  protected getId(internalId: string): string {
    return `${this.getPrefix()}:${internalId}`;
  }

  public abstract getProduct(id: string): Promise<SupermarketProduct | null>;

  public async getProducts(ids: string[]): Promise<(SupermarketProduct | null)[]> {
    return await Promise.all(ids.map((id) => this.getProduct(id)));
  }

  public abstract search(term: string): Promise<SearchResultWithoutTracking>;
}
