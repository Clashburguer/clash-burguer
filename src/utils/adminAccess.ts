/**
 * Admin Access & Studio Environment Detection
 * 
 * Rules:
 * 1. AI Studio Build Environment:
 *    - The preview runs inside an iframe (window.self !== window.top)
 *    - Hostname contains 'ais-dev-' or local development host ('localhost', '127.0.0.1')
 *    - Returns true: the owner can view and edit the cash register directly inside Studio.
 * 
 * 2. Regular Customers (Delivery or Mesa):
 *    - Accessing on mobile phones or external browsers outside AI Studio.
 *    - Returns false: Caixa button and admin links are completely hidden.
 * 
 * 3. Secret Admin Access:
 *    - The owner can also unlock admin on their personal phone via ?admin=1226, #admin,
 *      or by tapping 5 times on the Clash Burguer logo.
 */

export function isStudioEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const isInIframe = window.self !== window.top;
    const host = window.location.hostname || '';
    const isDevHost =
      host.includes('ais-dev-') ||
      host === 'localhost' ||
      host === '127.0.0.1';

    return isInIframe || isDevHost;
  } catch {
    // Cross-origin iframe exception implies we are inside AI Studio's embed iframe
    return true;
  }
}

export function isExplicitAdminAuthorized(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    if (
      searchParams.get('admin') === 'true' ||
      searchParams.get('admin') === '1226' ||
      searchParams.get('caixa') === 'true' ||
      hash === '#admin' ||
      hash === '#caixa'
    ) {
      try {
        localStorage.setItem('clash_admin_authorized', 'true');
      } catch {
        // ignore
      }
      return true;
    }

    if (localStorage.getItem('clash_admin_authorized') === 'true') {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

export function canShowAdminControls(): boolean {
  return isStudioEnvironment() || isExplicitAdminAuthorized();
}

export function enableAdminMode(): void {
  try {
    localStorage.setItem('clash_admin_authorized', 'true');
  } catch {
    // ignore
  }
}

export function disableAdminMode(): void {
  try {
    localStorage.removeItem('clash_admin_authorized');
  } catch {
    // ignore
  }
}
