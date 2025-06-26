import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { SortBy } from '$lib';
import type { SearchResultItem } from '$lib/models';

export const load: PageLoad = async (
  event
): Promise<{
  query: string;
  sortBy: SortBy;
  results: SearchResultItem[];
}> => {
  const params = event.url.searchParams;

  const query: string = params.get('query')?.trim() ?? '';
  const sortBy: SortBy = (params.get('sortBy') as SortBy) ?? SortBy.NONE;

  if (sortBy && !Object.values(SortBy).includes(sortBy)) {
    error(400, {
      message: 'Invalid query parameter "sortBy"',
    });
  }

  let results: SearchResultItem[];

  if (query) {
    const params = new URLSearchParams();
    params.set('q', query);
    if (sortBy !== SortBy.NONE) {
      params.set('sortBy', sortBy);
    }

    const res = await event.fetch(`/api/search?${params.toString()}`);
    results = (await res.json())?.items;
  } else {
    results = [];
  }

  return {
    query,
    sortBy,
    results,
  };
};
