export interface SearchResultItem {
  id: string;
  name: string;
  price: number;
  isSpecialOffer: boolean;
  image: string;
  supermarket: string;
  isFavourite?: boolean;
}

export interface SearchResult {
  items: SearchResultItem[];
}
