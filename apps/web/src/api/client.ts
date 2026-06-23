import type { ApiError } from '@basira/shared';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/** Absolute URL for a resource served directly by the API (e.g. <img> sources). */
export function apiUrl(path: string): string {
  return `${BASE_URL}/${path.replace(/^\//, '')}`;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly issues?: unknown[],
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Send as multipart instead of JSON (file uploads). */
  formData?: FormData;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.replace(/^\//, ''), `${BASE_URL}/`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/**
 * The single fetch wrapper. Every call sends the httpOnly auth cookie
 * (`credentials: 'include'`) and surfaces the typed API error envelope.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, formData, signal } = options;

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: payload,
    credentials: 'include',
    signal,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const err = (data as ApiError | undefined)?.error;
    throw new ApiRequestError(
      res.status,
      err?.code ?? 'unknown',
      err?.message ?? res.statusText,
      err?.issues,
    );
  }

  return data as T;
}
