export interface SearchableItem {
  id: string;
  products: {
    key: string;
    size: number; // Used for comparing across different sizes
  }[];
}
