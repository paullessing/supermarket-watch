// TODO replace with data only tracking relevant fields and containing multiple items
export interface Favourites {
  id: string;
  name: string;
  products: HistoricalProduct[];
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
