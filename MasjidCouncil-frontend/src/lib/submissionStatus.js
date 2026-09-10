import { CheckCircle2, Clock, Layers, TimerReset, XCircle } from 'lucide-react';

/**
 * One place per submission status: the filter tiles, the row pills and their dots all
 * read from here, so a colour or a label only ever changes in one file.
 *
 * Lives in lib/ rather than beside the badge components because Fast Refresh only
 * works when a component file exports components and nothing else.
 */
export const STATUSES = [
  { key: 'all', label: 'എല്ലാം', en: 'All', icon: Layers, tint: 'text-gray-600 bg-gray-100', ring: 'ring-gray-900/15', dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-700' },
  { key: 'pending', label: 'പെൻഡിംഗ്', en: 'Pending', icon: Clock, tint: 'text-amber-600 bg-amber-50', ring: 'ring-amber-500/40', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  { key: 'under_review', label: 'പരിശോധനയിൽ', en: 'Under review', icon: TimerReset, tint: 'text-blue-600 bg-blue-50', ring: 'ring-blue-500/40', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  { key: 'approved', label: 'അംഗീകരിച്ചു', en: 'Approved', icon: CheckCircle2, tint: 'text-emerald-600 bg-emerald-50', ring: 'ring-emerald-500/40', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  { key: 'rejected', label: 'നിരസിച്ചു', en: 'Rejected', icon: XCircle, tint: 'text-rose-600 bg-rose-50', ring: 'ring-rose-500/40', dot: 'bg-rose-500', pill: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
];

export const statusMeta = (key) => STATUSES.find((s) => s.key === key) || STATUSES[0];

/**
 * Area-verification list filter. The backend reads ?verification=pending|done and
 * ignores anything else, so 'all' deliberately sends no parameter.
 */
export const VERIFICATION_FILTERS = [
  { key: 'all', label: 'എല്ലാം' },
  { key: 'pending', label: 'വെരിഫിക്കേഷൻ ബാക്കി' },
  { key: 'done', label: 'വെരിഫൈ ചെയ്തവ' },
];
