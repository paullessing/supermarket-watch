import type { PageLoad } from './$types';
import type { PriceComparison } from '$lib/models';
import { fetchJson } from '$lib/util/fetch';

export const load: PageLoad = async (
  event
): Promise<{
  priceComparisons: PriceComparison[];
}> => {
  const { items: priceComparisons } = await fetchJson<{
    items: PriceComparison[];
  }>(event.fetch, '/api/price-comparisons');

  return {
    priceComparisons,
  };
};
