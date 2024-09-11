import { SortBy, SortOrder } from '$lib';
import { error } from '@sveltejs/kit';
import { $supermarketService } from '$lib/server/supermarkets';

export async function search(query: string, sortBy: SortBy, querySortOrder: string | undefined) {
  const supermarketService = await $supermarketService;
  let sortOrder = SortOrder.ASCENDING;

  if (querySortOrder) {
    if (!['asc', 'desc', '1', '-1', 1, -1].includes(querySortOrder)) {
      error(400, 'Query parameter "sortOrder" must be "asc", "desc", 1 or -1 if provided');
    }
    sortOrder = ['asc', '1', 1].includes(querySortOrder) ? SortOrder.ASCENDING : SortOrder.DESCENDING;
  }
  const items = await supermarketService.search(query, sortBy, sortOrder);
  if (!items) {
    error(404, 'No items found');
  }

  return { items };
}
