export const VALID_TABLES = ['01', '02', '03', '04'] as const;
export type ValidTableNumber = (typeof VALID_TABLES)[number];

const STORAGE_KEY = 'clash_table_number';

/**
 * Normalizes table input to '01', '02', '03', '04'.
 * Returns null if not in valid range (01 to 04).
 */
export function normalizeTableNumber(rawTable: string | null | undefined): ValidTableNumber | null {
  if (!rawTable) return null;
  const clean = rawTable.trim().replace(/^0+/, ''); // '01' -> '1', '1' -> '1'
  if (['1', '2', '3', '4'].includes(clean)) {
    return clean.padStart(2, '0') as ValidTableNumber;
  }
  return null;
}

/**
 * Detects table from URL search parameters (?origem=mesa&mesa=XX)
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

  const params = new URLSearchParams(window.location.search);
  const origem = params.get('origem')?.toLowerCase();
  const mesaRaw = params.get('mesa');

  // If URL explicitly requests table origin
  if (origem === 'mesa') {
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
