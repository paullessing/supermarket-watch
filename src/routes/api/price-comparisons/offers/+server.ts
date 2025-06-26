import { error, json } from '@sveltejs/kit';
import { parseISO } from 'date-fns/parseISO';
import { $productRepository } from '$lib/server/db/product-repository.service';

export async function GET({ url: { searchParams } }): Promise<Response> {
  const since = searchParams.get('since');

  let startDate: Date | null = null;
  if (since) {
    try {
      startDate = parseISO(since);
    } catch (e) {
      console.error(e);
      return error(
        400,
        'Invalid format for parameter "since", ISO-8601 string expected'
      );
    }
  }

  if (!startDate) {
    return error(400, 'Parameter "since" is required');
  }

  const productRepo = await $productRepository;

  return json({
    items:
      await productRepo.getProductsWithSpecialOffersStartingSince(startDate),
  });
}
