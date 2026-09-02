import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { FEATURE_LABELS } from '../lib/adminAccess';

/**
 * Shown when a state admin opens a feature the super admin has switched off. The sidebar hides
 * the entry, but the URL is still typeable and old tabs still exist, so the page needs a real
 * state rather than an empty screen or a failed request.
 */
const FeatureBlocked = ({ feature, homePath = '/admin-home' }) => {
  const navigate = useNavigate();
  const label = FEATURE_LABELS[feature] || 'This section';

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
        <Lock className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <h2 className="mt-4 text-lg font-bold text-gray-900">{label} is not available</h2>
      <p className="mt-2 text-sm text-gray-500">
        The super admin has turned off state admin access to this section. Contact them if you
        need it enabled.
      </p>
      <button
        type="button"
        onClick={() => navigate(homePath)}
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1F6B3A] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2E7D4F]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </button>
    </div>
  );
};

export default FeatureBlocked;
