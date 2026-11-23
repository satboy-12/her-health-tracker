export type ApiErrorCode =
  | 'BACKEND_UNAVAILABLE'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR';

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly endpoint: string;
  public readonly method: string;
  public readonly fieldErrors?: Record<string, string>;

  constructor(params: {
    message: string;
    code: ApiErrorCode;
    status: number;
    endpoint: string;
    method: string;
    fieldErrors?: Record<string, string>;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.endpoint = params.endpoint;
    this.method = params.method;
    this.fieldErrors = params.fieldErrors;
  }
}

let inMemoryToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export function registerUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\/+$/, '');
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const url = buildApiUrl(path);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (inMemoryToken) {
    headers['Authorization'] = `Bearer ${inMemoryToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
      signal: options.signal,
    });
  } catch (err) {
    const baseLabel = getApiBaseUrl() || 'relative /api origin (VITE_API_BASE_URL not set)';
    const reason = err instanceof Error ? err.message : 'Network error';
    throw new ApiError({
      code: 'BACKEND_UNAVAILABLE',
      status: 0,
      endpoint: path,
      method,
      message: `Spring Boot API unavailable for ${method} ${path} via ${baseLabel}: ${reason}`,
    });
  }

  const contentType = response.headers.get('content-type') || '';

  // Vite dev/preview serves index.html (text/html) for unknown /api/* routes when no backend proxy is connected.
  if (contentType.includes('text/html')) {
    const baseLabel = getApiBaseUrl() || 'not configured (VITE_API_BASE_URL is empty)';
    throw new ApiError({
      code: 'BACKEND_UNAVAILABLE',
      status: response.status,
      endpoint: path,
      method,
      message: `Spring Boot endpoint ${method} ${path} is not connected (VITE_API_BASE_URL: ${baseLabel}). Received HTML shell instead of JSON.`,
    });
  }

  let parsedBody: unknown = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = { message: text };
      }
    }
  }

  if (!response.ok) {
    const bodyObj =
      parsedBody && typeof parsedBody === 'object' ? (parsedBody as Record<string, unknown>) : {};
    const serverMessage =
      (typeof bodyObj.message === 'string' && bodyObj.message) ||
      (typeof bodyObj.error === 'string' && bodyObj.error) ||
      (typeof bodyObj.detail === 'string' && bodyObj.detail) ||
      `Request failed with status ${response.status}`;

    if (response.status === 401) {
      if (unauthorizedHandler) unauthorizedHandler();
      throw new ApiError({
        code: 'UNAUTHORIZED',
        status: 401,
        endpoint: path,
        method,
        message: serverMessage,
      });
    }

    if (response.status === 403) {
      throw new ApiError({
        code: 'FORBIDDEN',
        status: 403,
        endpoint: path,
        method,
        message: serverMessage,
      });
    }

    if (response.status === 404) {
      const hasJsonBody =
        typeof bodyObj.message === 'string' ||
        typeof bodyObj.error === 'string' ||
        typeof bodyObj.detail === 'string';
      if (!getApiBaseUrl() && !hasJsonBody) {
        throw new ApiError({
          code: 'BACKEND_UNAVAILABLE',
          status: 404,
          endpoint: path,
          method,
          message: `Spring Boot backend is not connected yet at ${method} ${path}. Set VITE_API_BASE_URL to your Spring Boot server origin.`,
        });
      }
      throw new ApiError({
        code: 'NOT_FOUND',
        status: 404,
        endpoint: path,
        method,
        message: `Endpoint not found on Spring Boot backend: ${method} ${path}`,
      });
    }

    if (response.status === 400 || response.status === 422) {
      const fieldErrors =
        bodyObj.errors && typeof bodyObj.errors === 'object'
          ? (bodyObj.errors as Record<string, string>)
          : undefined;
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        status: response.status,
        endpoint: path,
        method,
        message: serverMessage,
        fieldErrors,
      });
    }

    throw new ApiError({
      code: 'SERVER_ERROR',
      status: response.status,
      endpoint: path,
      method,
      message: serverMessage,
    });
  }

  return parsedBody as T;
}
