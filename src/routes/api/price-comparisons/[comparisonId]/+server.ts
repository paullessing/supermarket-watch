import { error, json } from '@sveltejs/kit';
import { type ManualConversion, standardiseUnit } from '$lib/models';
import { EntityNotFoundError } from '$lib/server/db/entity-not-found.error';
import { $productRepository } from '$lib/server/db/product-repository.service';
import { SupermarketProduct } from '$lib/server/supermarket-product.model';
import { $supermarketService } from '$lib/server/supermarkets';

export async function POST({ params: { comparisonId }, request }): Promise<Response> {
  const { productId, manualConversion: manualConversionData } = await request.json();

  if (!productId) {
    return error(400, 'Missing body value: productId');
  }

  console.log('updateComparison', comparisonId, productId, manualConversionData);

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

  console.log(`Updating comparison ID "${comparisonId}"`, product, manualConversion);
  const productRepo = await $productRepository;

  const resultId = await productRepo.addToComparison(comparisonId, product, new Date(), manualConversion);

  return json({
    trackingId: resultId,
  });
}

export async function DELETE({ params: { comparisonId } }): Promise<Response> {
  await (await $productRepository).removeComparison(comparisonId);

  return new Response(null, {
    status: 204,
  });
}

export async function PATCH({ params: { comparisonId }, request }): Promise<Response> {
  const { name } = await request.json();

  try {
    const updatedItem = await (
      await $productRepository
    ).updatePriceComparisonConfig(comparisonId, {
      name,
    });
    return json(updatedItem);
  } catch (e) {
    if (e instanceof EntityNotFoundError) {
      return error(404);
    }
    console.error(e);
    throw e;
  }
}
