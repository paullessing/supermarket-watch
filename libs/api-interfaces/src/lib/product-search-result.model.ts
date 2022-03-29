export interface ProductSearchResult {
  name: string;
  trackingId: string;
  units: string[][];
}

export interface ProductSearchResults {
  results: ProductSearchResult[];
}
