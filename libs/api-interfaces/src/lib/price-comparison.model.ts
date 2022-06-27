export interface PriceComparison {
  id: string;
  name: string;
  image: string;
  unitOfMeasurement: {
    name: string;
    amount: number;
  };
  pricePerUnit: {
    best: number;
    usual: number;
  };
  products: ComparisonProductData[];
  // specialOffers: {
  //   lastDiscounted: Date;
  // }
}

export interface ComparisonProductData {
  id: string;
  supermarket: string;
  name: string;
  image: string;
  url: string;
  price: number;
  pricePerUnit: number;
  packSize: {
    unit: string;
    amount: number;
  };
  specialOffer: null | {
    offerText: string;
    originalPrice: null | number;
    validUntil: string;
  };
}
