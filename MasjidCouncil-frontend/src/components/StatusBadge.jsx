import { BadgeCheck, Clock } from 'lucide-react';
import { statusMeta } from '../lib/submissionStatus';

// Status and area-verification pills for submissions. Colours and labels come from
// lib/submissionStatus so the list tiles and these pills can never drift apart.

export const StatusPill = ({ status }) => {
  const m = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${m.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.en}
    </span>
  );
};

/**
 * Area verification state. Un-verified applications are no longer hidden from admins,
 * so this pill is the thing that tells them the area admin has not spoken yet — amber
 * rather than the old grey "Awaiting", because it is now a call to chase someone and
 * not just a blank. Both variants carry an icon and a word, never colour alone.
 */
export const VerifyPill = ({ verified }) =>
  verified ? (
    <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
      <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
      വെരിഫിക്കേഷൻ ബാക്കി
    </span>
  );
