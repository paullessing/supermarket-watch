import { text } from '@sveltejs/kit';
import { getDbHealthcheck } from '$lib/server/db/db.providers';

export async function GET(): Promise<Response> {
  const isDbOk = await getDbHealthcheck();

  if (isDbOk) {
    return text('ALLOK');
  } else {
    return text('FAIL', {
      status: 503,
    });
  }
}
