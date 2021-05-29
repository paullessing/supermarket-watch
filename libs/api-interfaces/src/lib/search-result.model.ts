export interface SearchResultItem {
  id: string;
  name: string;
  price: number;
  specialOffer: null | {
    offerText: string;
    originalPrice: null | number;
    validUntil: string;
  }
  image: string;
  supermarket: string;
  isFavourite?: boolean;
}

export interface SearchResult {
  items: SearchResultItem[];
}
