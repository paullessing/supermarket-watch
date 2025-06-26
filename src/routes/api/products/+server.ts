import { error, json } from '@sveltejs/kit';
import { toProductDetails } from './toProductDetails';
import type { ComparisonProductData } from '$lib/models';
import { $supermarketService } from '$lib/server/supermarkets';
import { InvalidIdException } from '$lib/server/supermarkets/supermarket-list.service';

export async function GET({ url: { searchParams } }): Promise<Response> {
  const ids = searchParams.getAll('ids').flatMap((value) => value.split(',')) ?? [];

  if (!ids.length) {
    return error(400, 'Missing required URL parameter "ids"');
  }

  const supermarketService = await $supermarketService;

  try {
    const items: ComparisonProductData[] = await Promise.all<ComparisonProductData>(
      ids.map(async (id): Promise<ComparisonProductData> => {
        const item = await supermarketService.getSingleItem(id, new Date());
        return toProductDetails(item);
      })
    );

    return json({
      items,
    });
  } catch (e) {
    if (e instanceof InvalidIdException) {
      return error(404, `Invalid ID: ${e.id}`);
    }
    throw e;
  }
}
