const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ── Network Resilience Configuration ──
// Global request timeout for slow/unstable connections (3G, VPN, high latency)
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Automatic retry configuration for transient failures
export const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000; // Base delay before first retry (exponential backoff)

// Methods considered idempotent — safe to retry automatically
const IDEMPOTENT_METHODS = new Set(['GET', 'PUT', 'PATCH', 'DELETE']);

// ── Network status tracking ──
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { isOnline = true; });
  window.addEventListener('offline', () => { isOnline = false; });
}

export function isNetworkOnline(): boolean {
  return isOnline;
}

export interface NetworkErrorInfo {
  isNetworkError: boolean;
  isTimeout: boolean;
  retryable: boolean;
}

/**
 * Detect network-layer failures from a fetch error.
 */
export function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof TypeError) return true; // fetch throws TypeError on network failure
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed') ||
    msg.includes('net::ERR_') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('aborted') ||
    msg.includes('AbortError') ||
    msg.includes('The Internet connection appears to be offline') ||
    msg.includes('Load failed')
  );
}

/**
 * Build a user-friendly network error message for toasts.
 */
export function getNetworkErrorMessage(): string {
  return 'අන්තර්ජාල සම්බන්ධතාවය බිඳවැටී ඇත. කරුණාකර නැවත උත්සාහ කරන්න. (Network connection timeout. Please retry.)';
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  /** When true, returns the full JSON response envelope instead of unwrapping json.data */
  fullResponse?: boolean;
  /** Override the global 30s timeout (ms). Use -1 to disable. */
  timeout?: number;
  /** Override automatic retry. Use false to disable for individual requests. */
  retry?: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    params,
    fullResponse,
    timeout = REQUEST_TIMEOUT,
    retry: shouldRetry = true,
  } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  // Build headers with optional auth token
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const maxAttempts = shouldRetry && IDEMPOTENT_METHODS.has(method) ? MAX_RETRIES + 1 : 1;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Skip retry delay on first attempt
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s
      await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
    }

    // ── Request timeout via AbortController ──
    const controller = new AbortController();
    const timeoutId = timeout > 0
      ? setTimeout(() => controller.abort(), timeout)
      : undefined;

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
        signal: controller.signal,
      });

      // ── Automatic retry on 5xx server errors ──
      if (res.status >= 500 && attempt < maxAttempts - 1) {
        await res.text().catch(() => ''); // Drain body
        lastError = new Error(`HTTP ${res.status}: Server error`);
        continue;
      }

      let json: any;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        // If 401 and NOT on auth endpoints, clear auth and redirect to login
        if (res.status === 401 && !endpoint.startsWith('/auth/')) {
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
        }
        throw new Error(json?.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      // When fullResponse is true, return the full JSON envelope (useful for paginated endpoints)
      if (fullResponse) return json as T;
      // Otherwise, unwrap the envelope: the backend wraps data in { success, data, meta }
      // Return the data field directly for convenience, or the full response if no data
      return json?.data ?? json;
    } catch (err: unknown) {
      lastError = err;

      // AbortError = timeout — retry on idempotent methods
      if (err instanceof DOMException && err.name === 'AbortError') {
        const timeoutErr = new Error(`Request timed out after ${timeout}ms`);
        timeoutErr.name = 'TimeoutError';
        lastError = timeoutErr;
        if (attempt < maxAttempts - 1) continue;
        break;
      }

      // Network-level failure — retry on idempotent methods
      if (isNetworkError(err) && attempt < maxAttempts - 1) {
        continue;
      }

      break;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export const api = {
  get: <T>(endpoint: string, params?: ApiOptions['params'], fullResponse?: boolean, options?: Omit<ApiOptions, 'method' | 'body' | 'params' | 'fullResponse'>) =>
    request<T>(endpoint, { params, fullResponse, ...options }),

  post: <T>(endpoint: string, body: unknown, fullResponse?: boolean, options?: Omit<ApiOptions, 'method' | 'body' | 'params' | 'fullResponse'>) =>
    request<T>(endpoint, { method: 'POST', body, fullResponse, ...options }),

  put: <T>(endpoint: string, body: unknown, fullResponse?: boolean, options?: Omit<ApiOptions, 'method' | 'body' | 'params' | 'fullResponse'>) =>
    request<T>(endpoint, { method: 'PUT', body, fullResponse, ...options }),

  patch: <T>(endpoint: string, body: unknown, fullResponse?: boolean, options?: Omit<ApiOptions, 'method' | 'body' | 'params' | 'fullResponse'>) =>
    request<T>(endpoint, { method: 'PATCH', body, fullResponse, ...options }),

  delete: <T>(endpoint: string, fullResponse?: boolean, options?: Omit<ApiOptions, 'method' | 'body' | 'params' | 'fullResponse'>) =>
    request<T>(endpoint, { method: 'DELETE', fullResponse, ...options }),
};

export { REQUEST_TIMEOUT as REQUEST_TIMEOUT_MS };
export default api;