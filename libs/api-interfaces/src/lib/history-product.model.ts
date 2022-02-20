// TODO replace with data only tracking relevant fields and containing multiple items
export interface HistoryProduct {
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
