import type { ProductDetails } from '$lib/models';
import { SupermarketProduct } from '$lib/server/supermarket-product.model';

export function toProductDetails(product: SupermarketProduct): ProductDetails {
  return {
    id: product.id,
    name: product.name,
    image: product.image,
    url: product.url,

    supermarket: product.supermarket,

    price: product.price,
    pricePerUnit: product.pricePerUnit,
    packSize: {
      unit: product.packSize.unit,
      amount: product.packSize.amount,
    },
    unitAmount: product.unitAmount,
    unitName: product.unitName,

    specialOffer: product.specialOffer,
  };
}
