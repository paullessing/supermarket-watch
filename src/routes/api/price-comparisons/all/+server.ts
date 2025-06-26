import { $productRepository } from '$lib/server/db/product-repository.service';

export async function DELETE(): Promise<Response> {
  const productRepo = await $productRepository;

  await productRepo.removeAllComparisons();
  await productRepo.removeAllHistory();

  return new Response(null, {
    status: 204,
  });
}
