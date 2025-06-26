import { $productRepository } from '$lib/server/db/product-repository.service';

export async function DELETE({ params: { comparisonId, productId } }): Promise<Response> {
  await (await $productRepository).removeProductFromComparison(comparisonId, productId);

  return new Response(null, {
    status: 204,
  });
}
