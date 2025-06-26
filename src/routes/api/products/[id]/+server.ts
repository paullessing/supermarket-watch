import { error, json } from '@sveltejs/kit';
import { toProductDetails } from '../toProductDetails';
import { $supermarketService } from '$lib/server/supermarkets';
import { InvalidIdException } from '$lib/server/supermarkets/supermarket-list.service';

export async function GET({ params: { id }, url: { searchParams } }): Promise<Response> {
  const force = searchParams.get('force');
  const isForce = force === 'true';
  try {
    console.log(`Fetching product ${id}${isForce ? ' (forced)' : ''}`);
    const supermarketService = await $supermarketService;

    return json(toProductDetails(await supermarketService.getSingleItem(id, new Date(), isForce)));
  } catch (e) {
    if (e instanceof InvalidIdException) {
      return error(404);
    }
    throw e;
  }
}
