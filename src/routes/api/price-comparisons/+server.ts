import { error, json } from '@sveltejs/kit';
import { type ManualConversion, standardiseUnit } from '$lib/models';
import { $productRepository } from '$lib/server/db/product-repository.service';
import { SupermarketProduct } from '$lib/server/supermarket-product.model';
import { $supermarketService } from '$lib/server/supermarkets';

export async function GET({ url: { searchParams } }): Promise<Response> {
  const force = searchParams.get('force');
  const forceFresh = force ? (force as 'none' | 'all' | 'today') : 'none';
  const promotionsOnly = searchParams.get('promotionsOnly');

  const trackedProducts = await (await $supermarketService).getAllPriceComparisons(new Date(), { forceFresh });

  return json({
    items: trackedProducts.filter(
      ({ products }) => !promotionsOnly || products.find(({ specialOffer }) => !!specialOffer)
    ),
  });
}

export async function POST({ request }): Promise<Response> {
  const { productId, manualConversion: manualConversionData } = await request.json();

  if (!productId) {
    return error(400, 'Missing body value: productId');
  }

  console.log('addComparison', productId, manualConversionData);

  let product: SupermarketProduct;
  try {
    // NOTE: This returns a TrackedProduct Product, but the actual "add tracking" call requires a SupermarketProduct which has more info.
    // We may need to split the responsibilities for getting cached data out of the `getSingleItem` call and make it explicit,
    // so that we can return either a "user wants this" kind of product or a "system needs all the info" kind of product.
    product = await (await $supermarketService).getSingleItem(productId, new Date());
  } catch (e) {
    console.error(e);
    return error(502, e as Error);
  }

  const manualConversion: ManualConversion | undefined = manualConversionData
    ? [
        {
          name: standardiseUnit(manualConversionData.fromUnit),
          multiplier: manualConversionData.fromQuantity,
        },
        {
          name: standardiseUnit(manualConversionData.toUnit),
          multiplier: manualConversionData.toQuantity,
        },
      ]
    : undefined;

  console.log(`Creating new comparison for productId "${productId}"`, product, manualConversion);
  const productRepo = await $productRepository;

  // Consider allowing user to set units on creation
  const resultId = await productRepo.createPriceComparison(
    product,
    product.unitName,
    product.unitAmount,
    new Date(),
    manualConversion
  );

  return json({
    trackingId: resultId,
  });
}
