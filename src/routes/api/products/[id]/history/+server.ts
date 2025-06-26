import { json } from '@sveltejs/kit';
import { $productRepository } from '$lib/server/db/product-repository.service';

export async function GET({ params: { id }, url: { searchParams } }): Promise<Response> {
  const history = await (await $productRepository).getHistory(id);

  return json({ history });
}
