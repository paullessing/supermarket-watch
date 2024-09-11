import type { PageServerLoad } from './$types';
import { SortBy } from '$lib';
import { error } from '@sveltejs/kit';

export const load = (async (event): Promise<{ query: string; sortBy: SortBy }> => {
  const params = event.url.searchParams;

  const query: string = params.get('q') ?? '';
  const sortBy: SortBy = (params.get('sortBy') as SortBy) ?? SortBy.NONE;

  if (sortBy && !Object.values(SortBy).includes(sortBy)) {
    error(400, {
      message: 'Invalid query parameter "sortBy"',
    });
  }

  return {
    query,
    sortBy,
  };
}) satisfies PageServerLoad;
