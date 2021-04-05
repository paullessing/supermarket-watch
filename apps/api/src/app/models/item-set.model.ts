export interface ItemSet {
  _id: string;
  name: string;
  variants: {
    supermarketId: string;
    regularPrice: number;
    priceHistory: {
      price: number;
      date: Date;
    }[];
  }[];
}
