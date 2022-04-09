import { SpecialOffer } from './special-offer.model';

export interface SupermarketProduct {
  id: string;
  name: string;
  image: string;
  supermarket: string;
  price: number;
  pricePerUnit: number;
  unitName: string;
  unitAmount: number;
  specialOffer: null | SpecialOffer;
}
