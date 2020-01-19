export interface SearchResultItem {
  id: string;
  name: string;
  price: number;
  image: string;
  supermarket: string;
}

export interface SearchResult {
  items: SearchResultItem[];
}
