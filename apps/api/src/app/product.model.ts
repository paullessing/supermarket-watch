export interface Product {
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
  }
}
