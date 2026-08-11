import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck, ChevronLeft, ChevronRight, CheckCircle2, Clock, Inbox,
  Layers, Search, TimerReset, XCircle,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import PageHeader from '../components/PageHeader';
import { SkeletonBar } from '../components/Skeleton';
import { cachedJson, peekJson } from '../lib/apiCache';

const PAGE_SIZE = 20;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FORM_TYPE_LABELS = {
  welfarefund: 'Welfare Fund — ഇമാം മുഅദ്ദിൻ ക്ഷേമനിധി (IMF)',
  mosquefund: 'Masjid Fund — മസ്ജിദ് ഫണ്ട്',
  affiliation: 'Affiliation — അഫിലിയേഷൻ',
  khateeb: 'Khateeb — ഖത്തീബ് രജിസ്ട്രേഷൻ',
};

// One place per status: the filter tile, the row pill and its dot all read from here.
const STATUSES = [
  { key: 'all', label: 'എല്ലാം', en: 'All', icon: Layers, tint: 'text-gray-600 bg-gray-100', ring: 'ring-gray-900/15', dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-700' },
  { key: 'pending', label: 'പെൻഡിംഗ്', en: 'Pending', icon: Clock, tint: 'text-amber-600 bg-amber-50', ring: 'ring-amber-500/40', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  { key: 'under_review', label: 'പരിശോധനയിൽ', en: 'Under review', icon: TimerReset, tint: 'text-blue-600 bg-blue-50', ring: 'ring-blue-500/40', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  { key: 'approved', label: 'അംഗീകരിച്ചു', en: 'Approved', icon: CheckCircle2, tint: 'text-emerald-600 bg-emerald-50', ring: 'ring-emerald-500/40', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  { key: 'rejected', label: 'നിരസിച്ചു', en: 'Rejected', icon: XCircle, tint: 'text-rose-600 bg-rose-50', ring: 'ring-rose-500/40', dot: 'bg-rose-500', pill: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
];

const statusMeta = (key) => STATUSES.find((s) => s.key === key) || STATUSES[0];

const initials = (name) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const shortDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StatusPill = ({ status }) => {
  const m = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${m.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.en}
    </span>
  );
};

const VerifyPill = ({ verified }) =>
  verified ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
      <BadgeCheck className="w-3.5 h-3.5" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-50 text-gray-400 ring-1 ring-gray-200">
      Awaiting
    </span>
  );

// Generic submissions list for dynamic forms. role: 'admin' | 'superadmin'
const SubmissionList = ({ role }) => {
  const { formType } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem(role === 'superadmin' ? 'superAdminToken' : 'adminToken');
  const base = role === 'superadmin' ? '/superadmin-submissions' : '/submissions';

  const [submissions, setSubmissions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce so each keystroke doesn't hit the server
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change restarts from page 1
  useEffect(() => {
    setPage(1);
  }, [formType, status, debouncedSearch]);

  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (status !== 'all') query.set('status', status);
  if (debouncedSearch) query.set('search', debouncedSearch);
  const listUrl = `${API_BASE_URL}/api/submissions/${formType}?${query}`;

  useEffect(() => {
    if (!token) {
      navigate(role === 'superadmin' ? '/superadmin-login' : '/admin-login');
      return;
    }
    let alive = true;
    const cached = peekJson(listUrl);
    if (cached) {
      setSubmissions(cached.data || []);
      setMeta(cached.meta || null);
      setLoading(false);
    } else {
      setLoading(true);
    }
    cachedJson(listUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((d) => {
        if (!alive) return;
        setSubmissions(d.data || []);
        setMeta(d.meta || null);
      })
      .catch(() => alive && setSubmissions([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listUrl]);

  const counts = meta?.counts || {};
  const open = (id) => navigate(`${base}/${formType}/${id}`);

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      {role === 'superadmin' ? <SuperAdminSidebar /> : <AdminSidebar />}

      <div className="flex-1 min-w-0">
        <PageHeader
          role={role}
          title={`${FORM_TYPE_LABELS[formType] || formType} — അപേക്ഷകൾ`}
          shortTitle="Submissions"
          subtitle="Dynamic form submissions"
          count={meta?.total}
        />

        <div className="p-4 sm:p-8 lg:p-10 pb-24 md:pb-10 max-w-[1440px] mx-auto space-y-5">
          {/* Status tiles double as the filter — one control, no dropdown to keep in sync */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STATUSES.map(({ key, label, en, icon: Icon, tint, ring }) => {
              const active = status === key;
              return (
                <button
                  key={key}
                  onClick={() => setStatus(key)}
                  aria-pressed={active}
                  className={`group text-left rounded-2xl border bg-white p-4 transition-all ${
                    active
                      ? `border-transparent ring-2 ${ring} shadow-sm -translate-y-0.5`
                      : 'border-[#E5E7EB] hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`w-9 h-9 rounded-xl grid place-items-center ${tint}`}>
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="text-2xl font-bold text-gray-900 tabular-nums leading-none mt-1">
                      {counts[key] ?? (loading ? '·' : 0)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-800 truncate">{label}</p>
                  <p className="text-[11px] text-gray-400 truncate">{en}</p>
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="പേര് / ഫോൺ തിരയുക"
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white outline-none focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15 transition-all"
              />
            </div>
            {!loading && meta && (
              <p className="text-xs text-gray-500 ml-auto">
                <span className="font-semibold text-gray-700 tabular-nums">{meta.total}</span> ഫലങ്ങൾ
              </p>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              <SkeletonBar className="h-14 w-full rounded-2xl" />
              <SkeletonBar className="h-64 w-full rounded-2xl" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-14 text-center">
              <span className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 grid place-items-center">
                <Inbox className="w-7 h-7" />
              </span>
              <p className="font-semibold text-gray-800">അപേക്ഷകൾ ഒന്നുമില്ല</p>
              <p className="text-sm text-gray-500 mt-1">
                {search || status !== 'all' ? 'ഫിൽട്ടർ മാറ്റി നോക്കുക.' : 'പുതിയ അപേക്ഷകൾ ഇവിടെ കാണാം.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 text-left text-[11px] uppercase tracking-wider text-gray-500">
                        <th className="px-5 py-3.5 font-semibold">പേര്</th>
                        <th className="px-5 py-3.5 font-semibold">ജില്ല</th>
                        <th className="px-5 py-3.5 font-semibold">ഏരിയ</th>
                        <th className="px-5 py-3.5 font-semibold">ഏരിയ വെരിഫിക്കേഷൻ</th>
                        <th className="px-5 py-3.5 font-semibold">സ്റ്റാറ്റസ്</th>
                        <th className="px-5 py-3.5 font-semibold">തീയതി</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {submissions.map((s) => (
                        <tr
                          key={s._id}
                          onClick={() => open(s._id)}
                          className="group cursor-pointer transition-colors hover:bg-emerald-50/50"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold grid place-items-center flex-shrink-0 ring-1 ring-emerald-100">
                                {initials(s.applicantName)}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{s.applicantName || '—'}</p>
                                <p className="text-xs text-gray-400 truncate">{s.phone || s.referenceNumber || ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-600 capitalize">{s.district || '—'}</td>
                          <td className="px-5 py-3.5 text-gray-600 capitalize">{(s.area || '—').toLowerCase()}</td>
                          <td className="px-5 py-3.5"><VerifyPill verified={!!s.areaVerification?.comment} /></td>
                          <td className="px-5 py-3.5"><StatusPill status={s.status} /></td>
                          <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap tabular-nums">{shortDate(s.createdAt)}</td>
                          <td className="pr-4">
                            <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards — a 6-column table never fits a phone */}
              <div className="md:hidden space-y-3">
                {submissions.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => open(s._id)}
                    className="w-full text-left bg-white rounded-2xl border border-[#E5E7EB] p-4 active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold grid place-items-center flex-shrink-0 ring-1 ring-emerald-100">
                        {initials(s.applicantName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">{s.applicantName || '—'}</p>
                        <p className="text-xs text-gray-500 truncate capitalize">
                          {[s.district, (s.area || '').toLowerCase()].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <StatusPill status={s.status} />
                      <VerifyPill verified={!!s.areaVerification?.comment} />
                      <span className="ml-auto text-xs text-gray-400 tabular-nums">{shortDate(s.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading && meta && meta.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
              <p className="tabular-nums">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} / ആകെ {meta.total}
              </p>
              {meta.pages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.page <= 1}
                    aria-label="Previous page"
                    className="w-9 h-9 grid place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 h-9 grid place-items-center rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 tabular-nums">
                    {meta.page} / {meta.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                    disabled={meta.page >= meta.pages}
                    aria-label="Next page"
                    className="w-9 h-9 grid place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionList;
