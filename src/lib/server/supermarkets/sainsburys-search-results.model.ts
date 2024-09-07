/* eslint @typescript-eslint/ban-types: "off" */ // This complains about the `{}` types which we don't have information for

export type PriceInPounds = number;

export interface SearchResults {
  products: SearchResult[];
}

export interface SearchResult {
  product_uid: string;
  favourite_uid: unknown;
  product_type: 'BASIC' | unknown;
  name: string;
  image: string; // size: L
  image_zoom: unknown;
  image_thumbnail: string; // size: M
  image_thumbnail_small: string; // size: S
  full_url: string; // product web URL
  unit_price: {
    price: PriceInPounds;
    measure: 'ltr' | string;
    measure_amount: number;
  };
  retail_price: {
    price: PriceInPounds;
    measure: 'unit' | string;
  };
  is_available: boolean;
  promotions: {
    end_date: string; // "2021-05-24T23:00:00Z"
    icon: string; // "https://www.sainsburys.co.uk/wcsstore/Sainsburys/Promotion assets/Promotion icons/SO_Fixed_Price_S_Icon.gif"
    original_price: number; // 4.5
    promotion_uid: string; // "10459956"
    start_date: string; // "2021-05-04T23:00:00Z"
    strap_line: string; // "Only £3.00: Save £1.50"
  }[];
  associations: unknown[];
  is_alcoholic: boolean;
  is_spotlight: boolean;
  is_intolerant: boolean;
  is_mhra: boolean;
  badges: unknown[];
  labels: unknown[];
  zone: unknown;
  department: unknown;
  reviews: {
    is_enabled: boolean;
    product_uid: string; // same as top
    total: number;
    average_rating: number; // 1-5
  };
  breadcrumbs: {
    label: string;
    url: string; // relative to root
  }[];
  details_html?: string; // base64 encoded HTML
  assets: {
    plp_image: string;
    images: {
      id: string; // e.g. '1'
      sizes: {
        width: number; // px
        height: number; // px
        url: string;
      }[];
    }[];
    video: unknown[];
  };
  description: string[]; // e.g. 'Almond drink with added calcium and vitamins.'
  important_information: string[];
  attachments: unknown[];
  categories: {
    id: string; // category ID e.g. '428940'
    name: string; // category name e.g. 'All dairy free'
  }[];
  display_icons: unknown[];
  pdp_deep_link: '/shop/ProductDisplay?storeId=10151&langId=44&productId=34260';
}
