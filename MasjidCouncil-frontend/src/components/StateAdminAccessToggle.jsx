import React, { useEffect, useState } from 'react';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { FEATURE_LABELS, fetchAdminAccess, updateAdminAccess } from '../lib/adminAccess';

/**
 * The super admin's switch for whether state admins may use this feature.
 *
 * Renders nothing for anyone but the super admin — a state admin must not see the control
 * that governs their own access. The server refuses the write regardless (the PUT is super
 * admin only), so this is presentation, not the security boundary.
 */
const StateAdminAccessToggle = ({ feature, show }) => {
  const [granted, setGranted] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) return undefined;
    let active = true;
    fetchAdminAccess()
      .then(({ granted: g }) => active && setGranted(g[feature]))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [feature, show]);

  if (!show) return null;

  const label = FEATURE_LABELS[feature] || feature;

  const toggle = async () => {
    const next = !granted;
    setSaving(true);
    setError('');
    // Optimistic, because the switch reads as a physical control — but reverted below if the
    // save fails, so the UI never claims an access change that did not happen.
    setGranted(next);
    try {
      const saved = await updateAdminAccess({ [feature]: next });
      setGranted(saved[feature]);
    } catch (err) {
      setGranted(!next);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              granted ? 'bg-[#EAF6EF] text-[#1F6B3A]' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {granted ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">State admin access</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {granted === null
                ? 'Checking…'
                : granted
                  ? `State admins can open and edit ${label}.`
                  : `${label} is hidden from state admins. Only you can edit it.`}
            </p>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={granted === true}
          aria-label={`State admin access to ${label}`}
          disabled={granted === null || saving}
          onClick={toggle}
          className={`inline-flex min-h-11 shrink-0 items-center gap-2.5 self-start rounded-lg border px-4 text-sm font-semibold transition-colors disabled:opacity-60 sm:self-auto ${
            granted
              ? 'border-green-200 bg-[#EAF6EF] text-[#1F6B3A] hover:bg-[#d9eee2]'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span
              aria-hidden="true"
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                granted ? 'bg-[#1F6B3A]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                  granted ? 'left-[1.125rem]' : 'left-0.5'
                }`}
              />
            </span>
          )}
          {granted ? 'Allowed' : 'Blocked'}
        </button>
      </div>
    </section>
  );
};

export default StateAdminAccessToggle;
