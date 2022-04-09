import { SpecialOffer } from './special-offer.model';

declare const SupermarketProductPhantomId: unique symbol;

export interface SupermarketProduct {
  [SupermarketProductPhantomId]: never;

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

export function SupermarketProduct(
  data: Omit<SupermarketProduct, typeof SupermarketProductPhantomId>
): SupermarketProduct {
  return data as SupermarketProduct;
}
