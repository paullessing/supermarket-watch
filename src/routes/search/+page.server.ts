import type { PageServerLoad } from './$types';

export const load = (async (event): Promise<{ results: string }> => {
	return {
		results: 'hello'
	};
}) satisfies PageServerLoad;
