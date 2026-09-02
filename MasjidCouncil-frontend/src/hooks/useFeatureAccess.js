import { useEffect, useState } from 'react';
import { fetchAdminAccess, isSuperAdmin } from '../lib/adminAccess';

/**
 * Whether the signed-in console may use an admin feature.
 *
 * Returns 'loading' | 'allowed' | 'denied'. The super admin resolves to 'allowed' without a
 * request — the switch never applies to them, and skipping the round trip keeps their pages
 * rendering immediately.
 *
 * A failed lookup resolves to 'allowed' rather than 'denied': the endpoints themselves are
 * guarded server-side, so the worst case is the page loads and its own requests 403, which is
 * a better failure than locking an authorised admin out because a network blip.
 */
export function useFeatureAccess(feature) {
  const [state, setState] = useState(() => (isSuperAdmin() ? 'allowed' : 'loading'));

  useEffect(() => {
    if (isSuperAdmin()) return undefined;
    let active = true;
    fetchAdminAccess()
      .then(({ effective }) => active && setState(effective[feature] ? 'allowed' : 'denied'))
      .catch(() => active && setState('allowed'));
    return () => {
      active = false;
    };
  }, [feature]);

  return state;
}
