import { SpecialOffer } from './special-offer.model';

export interface ProductDetails {
  id: string;
  name: string;
  image: string;
  url: string;

  supermarket: string;

  price: number;
  pricePerUnit: number;
  unitName: string;
  unitAmount: number;

  packSize: {
    amount: number;
    unit: string;
  };

  specialOffer: null | SpecialOffer;
}
