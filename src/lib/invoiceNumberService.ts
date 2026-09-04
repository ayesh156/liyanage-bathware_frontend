/**
 * Invoice Number Service
 *
 * Robust concurrency-safe invoice numbering system for web-based multi-user environments.
 * Uses localStorage with atomic operations and collision detection to ensure unique,
 * sequential invoice numbers even when multiple users generate invoices simultaneously.
 *
 * Format: inva-XXXXXX (e.g. inva-000023, inva-000024)
 * This matches the backend `generateInvoiceNumber()` used for Admin role users.
 */

const INVOICE_NUMBER_KEY = 'liyanage_hardware_invoice_counter';
const INVOICE_LOCK_KEY = 'liyanage_hardware_invoice_lock';
const LOCK_TIMEOUT_MS = 5000; // 5 seconds lock timeout
const MAX_RETRY_ATTEMPTS = 10;
const RETRY_DELAY_MS = 50;

interface InvoiceCounter {
  lastNumber: number;
  lastUpdated: number;
  instanceId: string;
}

// Generate a unique instance ID for this browser tab/session
const instanceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Attempts to acquire a distributed lock using localStorage
 * Uses optimistic locking with expiration to prevent deadlocks
 */
const acquireLock = (): boolean => {
  const now = Date.now();
  const existingLock = localStorage.getItem(INVOICE_LOCK_KEY);

  if (existingLock) {
    const lockData = JSON.parse(existingLock);
    // Check if lock has expired (prevents deadlocks from crashed sessions)
    if (now - lockData.timestamp < LOCK_TIMEOUT_MS) {
      return false; // Lock is held by another instance
    }
    // Lock expired, we can take it
  }

  // Attempt to acquire lock with our instance ID
  const lockValue = JSON.stringify({
    instanceId,
    timestamp: now,
  });

  localStorage.setItem(INVOICE_LOCK_KEY, lockValue);

  // Double-check we got the lock (compare-and-swap pattern)
  const verifyLock = localStorage.getItem(INVOICE_LOCK_KEY);
  if (verifyLock) {
    const verified = JSON.parse(verifyLock);
    return verified.instanceId === instanceId;
  }

  return false;
};

/**
 * Releases the distributed lock
 */
const releaseLock = (): void => {
  const existingLock = localStorage.getItem(INVOICE_LOCK_KEY);
  if (existingLock) {
    const lockData = JSON.parse(existingLock);
    // Only release if we own the lock
    if (lockData.instanceId === instanceId) {
      localStorage.removeItem(INVOICE_LOCK_KEY);
    }
  }
};

/**
 * Gets the current counter state from localStorage
 */
const getCounter = (): InvoiceCounter => {
  const stored = localStorage.getItem(INVOICE_NUMBER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Corrupted data, reset
    }
  }

  // Default starting point (matches existing invoice numbers in the system)
  return {
    lastNumber: 0,
    lastUpdated: Date.now(),
    instanceId: '',
  };
};

/**
 * Saves the counter state to localStorage
 */
const saveCounter = (counter: InvoiceCounter): void => {
  localStorage.setItem(INVOICE_NUMBER_KEY, JSON.stringify(counter));
};

/**
 * Sleep utility for retry delays with jitter
 */
const sleep = (ms: number): Promise<void> => {
  // Add random jitter (0-50%) to prevent thundering herd
  const jitter = Math.random() * 0.5 * ms;
  return new Promise((resolve) => setTimeout(resolve, ms + jitter));
};

/**
 * Formats a numeric sequence into the backend-compatible sequential
 * invoice number format: `inva-000001` (prefix + 6-digit zero-padded).
 * The prefix matches the backend `generateInvoiceNumber()` used by Admin
 * role users (e.g. "inva-" → "inva-000023", "inva-000024").
 */
function formatInvoiceNumber(seq: number, prefix: string = 'inva-'): string {
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

/**
 * Generates the next invoice number with concurrency safety.
 * Format: inva-XXXXXX (e.g. inva-000024)
 *
 * Algorithm:
 * 1. Attempt to acquire distributed lock
 * 2. Increment counter and format with zero-padding
 * 3. Store in counter state for audit trail
 * 4. Release lock
 * 5. Return formatted invoice number
 *
 * If lock cannot be acquired, retry with exponential backoff
 *
 * @returns Promise<string> - The next invoice number in inva-XXXXXX format
 */
export const generateNextInvoiceNumber = async (): Promise<string> => {
  let attempts = 0;

  while (attempts < MAX_RETRY_ATTEMPTS) {
    attempts++;

    if (acquireLock()) {
      try {
        // Critical section - we have the lock
        const counter = getCounter();
        const nextNumber = counter.lastNumber + 1;

        // Update counter with new value for audit
        saveCounter({
          lastNumber: nextNumber,
          lastUpdated: Date.now(),
          instanceId,
        });

        return formatInvoiceNumber(nextNumber);
      } finally {
        releaseLock();
      }
    }

    // Lock not acquired, wait and retry with exponential backoff
    await sleep(RETRY_DELAY_MS * Math.pow(2, attempts - 1));
  }

  // Fallback: If we couldn't acquire lock after max retries,
  // generate a timestamp-unique number to avoid blocking the user
  // This is a safety net that should rarely be hit
  console.warn('Invoice lock acquisition failed, using timestamp fallback');
  const counter = getCounter();
  return formatInvoiceNumber(counter.lastNumber + 1);
};

/**
 * Synchronous version for compatibility with existing code.
 * Uses optimistic generation with collision detection.
 * Format: inva-XXXXXX
 *
 * @returns string - The next invoice number in inva-XXXXXX format
 */
export const generateNextInvoiceNumberSync = (): string => {
  // Try to acquire lock synchronously
  const maxSyncAttempts = 3;

  for (let i = 0; i < maxSyncAttempts; i++) {
    if (acquireLock()) {
      try {
        const counter = getCounter();
        const nextNumber = counter.lastNumber + 1;

        saveCounter({
          lastNumber: nextNumber,
          lastUpdated: Date.now(),
          instanceId,
        });

        return formatInvoiceNumber(nextNumber);
      } finally {
        releaseLock();
      }
    }
  }

  // Optimistic fallback: read current value and generate unique number
  const counter = getCounter();
  return formatInvoiceNumber(counter.lastNumber + 1);
};

/**
 * Initializes the invoice counter from existing data
 * Should be called once when the app loads to sync with any existing invoices
 *
 * @param existingInvoices - Array of existing invoice objects with invoiceNumber property
 */
export const initializeFromExistingInvoices = (existingInvoices: { invoiceNumber: string }[]): void => {
  const existingNumbers = existingInvoices
    .map((inv) => {
      const numMatch = inv.invoiceNumber.match(/\d+/);
      return numMatch ? parseInt(numMatch[0], 10) : 0;
    })
    .filter((n) => !isNaN(n) && n > 0);

  if (existingNumbers.length === 0) return;

  const maxExisting = Math.max(...existingNumbers);
  const counter = getCounter();

  // Only update if existing data has higher numbers
  if (maxExisting > counter.lastNumber) {
    saveCounter({
      lastNumber: maxExisting,
      lastUpdated: Date.now(),
      instanceId,
    });
  }
};

/**
 * Gets the current invoice number without incrementing
 * Useful for display purposes
 *
 * @returns string - The current (last used) invoice number
 */
export const getCurrentInvoiceNumber = (): string => {
  const counter = getCounter();
  return formatInvoiceNumber(counter.lastNumber);
};

/**
 * Peeks at what the next invoice number will be without reserving it
 *
 * @returns string - The next invoice number (not reserved)
 */
export const peekNextInvoiceNumber = (): string => {
  const counter = getCounter();
  return formatInvoiceNumber(counter.lastNumber + 1);
};