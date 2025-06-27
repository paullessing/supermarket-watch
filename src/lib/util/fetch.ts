interface FetchFunction {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export function fetchJson<T = any>(
  fetch: FetchFunction,
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T>;
export function fetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T>;
export async function fetchJson<T = any>(
  inputOrFetch: FetchFunction | RequestInfo | URL,
  inputOrInit?: RequestInit | RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  let localFetch = fetch;
  let input: RequestInfo | URL;
  if (typeof inputOrFetch === 'function') {
    localFetch = inputOrFetch;
    input = inputOrInit as RequestInfo | URL;
  } else {
    input = inputOrFetch;
    init = inputOrInit as RequestInit;
  }

  const response = await localFetch(input, init);
  return await response.json();
}
