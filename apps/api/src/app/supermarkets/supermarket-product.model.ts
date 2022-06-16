declare const SupermarketProductPhantomId: unique symbol;

export interface SpecialOffer {
  offerText: string;
  originalPrice: null | number;
  validUntil: string;
  originalPricePerUnit: null | number;
}

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
  console.log('Supermarket Data\n\n', data);
  return data as SupermarketProduct;
}
