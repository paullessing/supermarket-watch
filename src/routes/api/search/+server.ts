import { error, json, type RequestEvent } from '@sveltejs/kit';
import { SortBy } from '$lib';
import { search } from '$lib/server/search';
import { ensureValidEnumValue } from '$lib/util/util';

export async function GET({
  url: { searchParams },
}: RequestEvent): Promise<Response> {
  const query = searchParams.get('q');
  if (!query) {
    return error(400, 'Missing request parameter "query"');
  }

  const sortOrder = searchParams.get('sortOrder') ?? '';
  const sortBy = ensureValidEnumValue(
    SortBy,
    searchParams.get('sortBy') ?? SortBy.NONE
  );

  const items = await search(query, sortBy, sortOrder);

  return json({ items });
}
