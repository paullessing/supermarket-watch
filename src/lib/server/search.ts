import { error } from '@sveltejs/kit';
import { SortBy, SortOrder } from '$lib';
import type { SearchResultItem } from '$lib/models';
import { $supermarketService } from '$lib/server/supermarkets';

export async function search(query: string, sortBy: SortBy, querySortOrder?: string): Promise<SearchResultItem[]> {
  const supermarketService = await $supermarketService;
  let sortOrder = SortOrder.ASCENDING;

  if (querySortOrder) {
    if (!['asc', 'desc', '1', '-1', 1, -1].includes(querySortOrder)) {
      error(400, 'Query parameter "sortOrder" must be "asc", "desc", 1 or -1 if provided');
    }
    sortOrder = ['asc', '1', 1].includes(querySortOrder) ? SortOrder.ASCENDING : SortOrder.DESCENDING;
  }
  const items = await timeout(supermarketService.search(query, sortBy, sortOrder), 8000);
  if (!items) {
    error(404, 'No items found');
  }

  return items;
}

function timeout<T>(data: Promise<T>, maxTimeMs: number): Promise<T> {
  let isResolved = false;
  return new Promise((resolve, reject) => {
    const ref = setTimeout(() => {
      isResolved = true;
      reject(new Error('Timeout exceeded'));
    }, maxTimeMs);

    data.then((result) => {
      if (!isResolved) {
        clearTimeout(ref);
        resolve(result);
      }
    });
  });
}
