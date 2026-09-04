/**
 * DB-Synced Next Invoice Number Service
 *
 * Fetches the exact next sequential invoice number from the backend
 * GET /api/invoices/next-number endpoint and caches it so the Live
 * Receipt Preview in Quick Checkout always matches the number that
 * will actually be saved and printed.
 */

import api from './api';

let cached: string | null = null;
let inflight: Promise<string> | null = null;
let stamp = 0;
const MAX_AGE = 30_000;

/** Fetch from the DB (single source of truth). Deduplicates in-flight calls. */
export const fetchNextInvoiceNumber = async (): Promise<string> => {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await api.get<any>('/invoices/next-number');
      const data = res?.data ?? res;
      const num = typeof data === 'string' ? data : data?.invoiceNumber;
      if (num) {
        cached = num;
        stamp = Date.now();
        return num;
      }
      throw new Error('Invalid next-number response');
    } finally {
      inflight = null;
    }
  })();
  return inflight;
};

/** Reset the cache so the next call re-queries the DB. Call after a sale. */
export const invalidateNextInvoiceNumberCache = (): void => {
  cached = null;
  stamp = 0;
  inflight = null;
};

/** Non-blocking synchronous read: warm cache value, or empty string. */
export const getNextInvoiceNumber = (): string => {
  if (cached) {
    if (Date.now() - stamp > MAX_AGE) fetchNextInvoiceNumber().catch(() => {});
    return cached;
  }
  fetchNextInvoiceNumber().catch(() => {});
  return '';
};

/** Async load used inside useEffect so the preview re-renders once fetched. */
export const loadNextInvoiceNumber = async (): Promise<string> => {
  if (cached && Date.now() - stamp <= MAX_AGE) return cached;
  return fetchNextInvoiceNumber();
};
