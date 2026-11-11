import 'react-native-get-random-values';
import { env } from '../config/env';
import { ApiError, type ServerErrorBody } from './errors';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** 명령성 요청. 같은 사용자 동작의 재시도에는 같은 키를 넘겨야 중복 처리되지 않는다. */
  idempotencyKey?: string;
  auth?: boolean;
  signal?: AbortSignal;
};

export type TokenProvider = {
  getAccessToken(): string | null;
  /** 성공 시 새 access token, 실패 시 null (로그아웃 처리됨) */
  refresh(): Promise<string | null>;
};

let tokenProvider: TokenProvider | null = null;

export function setTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

export function newIdempotencyKey(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  // RFC 4122 v4: version / variant 비트
  /* eslint-disable no-bitwise */
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  /* eslint-enable no-bitwise */
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(
    16,
    20,
  )}-${h.slice(20)}`;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const qs = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined)
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join('&');
  return `${env.apiBaseUrl}${path}${qs ? `?${qs}` : ''}`;
}

async function send(
  method: Method,
  path: string,
  opts: RequestOptions,
  token: string | null,
) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
  if (token) headers.Authorization = `Bearer ${token}`;

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), env.requestTimeoutMs);
  opts.signal?.addEventListener('abort', () => timeout.abort());
  try {
    return await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: timeout.signal,
    });
  } catch {
    throw new ApiError(0, null);
  } finally {
    clearTimeout(timer);
  }
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (!res.ok) throw new ApiError(res.status, json as ServerErrorBody | null);
  return json as T;
}

export async function request<T>(
  method: Method,
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const useAuth = opts.auth !== false;
  let token = useAuth ? tokenProvider?.getAccessToken() ?? null : null;
  let res = await send(method, path, opts, token);

  if (res.status === 401 && useAuth && tokenProvider) {
    token = await tokenProvider.refresh();
    if (token) res = await send(method, path, opts, token);
  }
  return parse<T>(res);
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>('GET', path, opts),
  post: <T>(path: string, opts?: RequestOptions) =>
    request<T>('POST', path, opts),
  put: <T>(path: string, opts?: RequestOptions) =>
    request<T>('PUT', path, opts),
  patch: <T>(path: string, opts?: RequestOptions) =>
    request<T>('PATCH', path, opts),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>('DELETE', path, opts),
};
