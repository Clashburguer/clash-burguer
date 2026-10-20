export const VALID_TABLES = ['01', '02', '03', '04'] as const;
export type ValidTableNumber = (typeof VALID_TABLES)[number];

const STORAGE_KEY = 'clash_table_number';

// Public Shared URL accessible by any customer without AI Studio login
export const DEFAULT_PUBLIC_URL = 'https://ais-pre-plvegozqr2zedonxslden2-885631107679.us-east1.run.app';

/**
 * Resolves the ideal public base URL for QR codes.
 * If in dev environment (ais-dev or localhost), returns the public shared URL so phones can open it.
 */
export function getRecommendedBaseUrl(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_PUBLIC_URL;
  }

  const hostname = window.location.hostname;
  
  // If running on localhost or dev container, use public shared URL
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('ais-dev-')) {
    return DEFAULT_PUBLIC_URL;
  }

  // Otherwise use the current origin + pathname (cleaned)
  const pathname = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
  return `${window.location.origin}${pathname}`;
}

/**
 * Normalizes table input to '01', '02', '03', '04'.
 * Tolerates variations like '1', '01', 'mesa1', 'mesa 01', '01/'.
 * Returns null if not in valid range (01 to 04).
 */
export function normalizeTableNumber(rawTable: string | null | undefined): ValidTableNumber | null {
  if (!rawTable) return null;
  
  // Strip non-digits and leading zeros
  const cleanDigits = rawTable.toString().replace(/\D/g, '').replace(/^0+/, '');
  
  if (['1', '2', '3', '4'].includes(cleanDigits)) {
    return cleanDigits.padStart(2, '0') as ValidTableNumber;
  }
  return null;
}

/**
 * Extracts URL search params from both standard search and hash-query strings.
 */
function getUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') {
    return new URLSearchParams();
  }

  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has('mesa') || searchParams.has('origem')) {
    return searchParams;
  }

  // Check hash for query params (e.g. /#/?origem=mesa&mesa=01)
  if (window.location.hash && window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?') + 1);
    return new URLSearchParams(hashQuery);
  }

  return searchParams;
}

/**
 * Detects table from URL search parameters (?origem=mesa&mesa=XX or ?mesa=XX)
 * or falls back to active session storage if user navigated.
 */
export function detectTableFromUrl(): {
  isTableOrder: boolean;
  tableNumber: ValidTableNumber | null;
  invalidError?: string;
} {
  if (typeof window === 'undefined') {
    return { isTableOrder: false, tableNumber: null };
  }

  const params = getUrlParams();
  const origem = params.get('origem')?.toLowerCase();
  const mesaRaw = params.get('mesa');

  // If user explicitly asks for delivery in URL (?origem=delivery), clear table mode
  if (origem === 'delivery') {
    clearTableSession();
    return { isTableOrder: false, tableNumber: null };
  }

  // If URL contains mesa parameter or origem=mesa
  if (origem === 'mesa' || mesaRaw) {
    const validTable = normalizeTableNumber(mesaRaw);
    if (validTable) {
      sessionStorage.setItem(STORAGE_KEY, validTable);
      return { isTableOrder: true, tableNumber: validTable };
    } else {
      // Invalid table parameter provided
      sessionStorage.removeItem(STORAGE_KEY);
      return {
        isTableOrder: false,
        tableNumber: null,
        invalidError: `Mesa "${mesaRaw || ''}" inválida. As mesas cadastradas são de 01 a 04.`,
      };
    }
  }

  // If no explicit table params, check if an active table session exists
  const stored = sessionStorage.getItem(STORAGE_KEY);
  const storedTable = normalizeTableNumber(stored);
  if (storedTable) {
    return { isTableOrder: true, tableNumber: storedTable };
  }

  return { isTableOrder: false, tableNumber: null };
}

/**
 * Clears active table session and switches back to delivery mode
 */
export function clearTableSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
    // Remove query params from URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.delete('origem');
    url.searchParams.delete('mesa');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
  }
}
