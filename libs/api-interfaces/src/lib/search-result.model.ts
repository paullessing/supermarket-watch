export interface SearchResultItem {
  id: string;
  name: string;
  price: number;
  specialOffer: null | {
    offerText: string;
    originalPrice: null | number;
    validUntil: string;
  };
  image: string;
  supermarket: string;
  trackingId: string | null;
}

export interface SearchResult {
  items: SearchResultItem[];
}
