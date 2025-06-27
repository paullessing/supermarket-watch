export interface PriceComparison {
  id: string;
  name: string;
  image: string;
  unitOfMeasurement: {
    name: string;
    amount: number;
  };
  price: {
    best: {
      unitPrice: number;
      itemPrice: number;
    };
    usual: {
      unitPrice: number;
      itemPrice: number;
    };
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
