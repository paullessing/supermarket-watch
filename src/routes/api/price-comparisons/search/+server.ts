import { error, json } from '@sveltejs/kit';
import type { ProductSearchResult } from '$lib/models';
import { conversionService } from '$lib/server/conversion.service';
import { $productRepository } from '$lib/server/db/product-repository.service';

export async function GET({ url: { searchParams } }): Promise<Response> {
  const searchTerm = searchParams.get('term');

  if (!searchTerm?.trim()) {
    return error(400, 'Query parameter "term" must not be blank');
  }

  const productRepo = await $productRepository;

  const result = await productRepo.search(searchTerm);
  const results = result.map((entry): ProductSearchResult => {
    const units = conversionService.getConvertableUnits(
      entry.products.map(({ product }) => product.unitName),
      entry.manualConversions
    );

    return {
      name: entry.name,
      trackingId: entry._id.toString(),
      units,
    };
  });

  return json({ results });
}
