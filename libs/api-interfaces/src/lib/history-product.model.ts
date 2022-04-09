export interface TrackedItemGroup {
  id: string;
  name: string;
  image: string;
  products: HistoricalProduct[];
  unitName: string;
  unitAmount: number;
}

export interface HistoricalProduct {
  id: string;
  name: string;
  supermarket: string;
  price: number;
  pricePerUnit: number;
  unitName: string;
  unitAmount: number;
  specialOffer: null | {
    offerText: string;
    originalPrice: null | number;
    validUntil: string;
  };
}
