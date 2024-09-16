import type { PageServerLoad } from './$types';
import { SortBy } from '$lib';
import { error } from '@sveltejs/kit';
import { search } from './search';
import type { SearchResultItem } from '$lib/models';

export const load = (async (event): Promise<{ query: string; sortBy: SortBy; results: SearchResultItem[] }> => {
  const params = event.url.searchParams;

  const query: string = params.get('q') ?? '';
  const sortBy: SortBy = (params.get('sortBy') as SortBy) ?? SortBy.NONE;

  if (sortBy && !Object.values(SortBy).includes(sortBy)) {
    error(400, {
      message: 'Invalid query parameter "sortBy"',
    });
  }

  const results = await search(query, sortBy);

  return {
    query,
    sortBy,
    results,
  };
}) satisfies PageServerLoad;
