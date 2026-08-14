import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, FileText, Heart, Building2, CalendarDays, TrendingUp, Search, Banknote } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import SelectField from '../components/SelectField';
import PageHeader from '../components/PageHeader';
import { StatCardsSkeleton, SkeletonBar } from '../components/Skeleton';
import { cachedJson, peekJson } from '../lib/apiCache';
import { C, cardShadow, statusBadge, TrendChart, DonutChart, StatusLegend } from '../components/DashboardCharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FORM_TYPES = [
  { key: 'affiliation', label: 'Affiliation', icon: FileText, color: C.green2, bg: C.greenSoft },
  { key: 'welfarefund', label: 'Welfare Fund', icon: Heart, color: C.blue, bg: '#EFF6FF' },
  { key: 'mosquefund', label: 'Masjid Fund', icon: Building2, color: C.purple, bg: '#F5F3FF' },
  { key: 'khateeb', label: 'Khateeb', icon: CalendarDays, color: C.orange, bg: '#FFF7ED' },
];

export const DISTRICT_NAV = [
  { to: '/district-home', icon: Home, label: 'Dashboard', short: 'Home' },
  ...FORM_TYPES.map((f) => ({
    to: `/district-home?type=${f.key}`,
    icon: f.icon,
    label: f.label,
    short: f.label.split(' ')[0],
  })),
];

const PERIODS = [
  { key: 'all', label: 'All time' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_year', label: 'This year' },
];

// ponytail: period filtering client-side, same trade-off as AreaAdminHome —
// one district's decided set is small; move to query params past a few thousand rows.
const inPeriod = (iso, period) => {
  if (period === 'all') return true;
  const d = new Date(iso);
  const now = new Date();
  if (period === 'this_year') return d.getFullYear() === now.getFullYear();
  if (period === 'this_month')
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
};

const inr = (n) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);

const searchCls =
  'w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-[0.7rem] text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15 placeholder:text-gray-400';

// District admin dashboard: view-only. Server sends only own-district submissions
// that are already decided (approved / rejected) — pending never reaches here.
const DistrictAdminHome = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const listUrl = `${API_BASE_URL}/api/district/submissions`;
  const cached = peekJson(listUrl);
  const [all, setAll] = useState(cached?.data || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('all');
  const [area, setArea] = useState('all');
  const [search, setSearch] = useState('');

  const formType = params.get('type') || 'all';
  const setFormType = (v) => setParams(v === 'all' ? {} : { type: v });
  const isDashboard = formType === 'all';
  const activeType = FORM_TYPES.find((f) => f.key === formType);

  useEffect(() => {
    if (!token || user.role !== 'districtadmin') {
      navigate('/admin-login');
      return;
    }
    cachedJson(listUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((d) => setAll(d.data || []))
      .catch(() => setError('Failed to load submissions.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const areas = useMemo(
    () => [...new Set(all.map((s) => s.area).filter(Boolean))].sort(),
    [all]
  );

  // Period scopes the whole dashboard; type/status/area/search narrow the table.
  const scoped = useMemo(() => all.filter((s) => inPeriod(s.createdAt, period)), [all, period]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter(
      (s) =>
        (formType === 'all' || s.formType === formType) &&
        (status === 'all' || s.status === status) &&
        (area === 'all' || s.area === area) &&
        (!q || (s.applicantName || '').toLowerCase().includes(q))
    );
  }, [scoped, formType, status, area, search]);

  const stats = useMemo(() => {
    const empty = () => ({ total: 0, approved: 0, rejected: 0, amount: 0 });
    const byType = Object.fromEntries(FORM_TYPES.map((f) => [f.key, empty()]));
    const agg = { total: 0, pending: 0, approved: 0, rejected: 0, amount: 0, paid: 0 };
    scoped.forEach((s) => {
      const t = byType[s.formType];
      const amt = Number(s.approvedAmount) || 0;
      if (t) {
        t.total++;
        if (t[s.status] !== undefined) t[s.status]++;
        t.amount += amt;
      }
      agg.total++;
      if (agg[s.status] !== undefined) agg[s.status]++;
      agg.amount += amt;
      agg.paid += Number(s.paidAmount) || 0;
    });
    return { byType, agg };
  }, [scoped]);

  const monthlyCounts = useMemo(() => {
    const counts = Array(12).fill(0);
    const year = new Date().getFullYear();
    all.forEach((s) => {
      const d = new Date(s.createdAt);
      if (d.getFullYear() === year) counts[d.getMonth()]++;
    });
    return counts;
  }, [all]);

  const titleCase = (value) =>
    (value || '').toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  const greeting = user.district
    ? `Welcome back, ${titleCase(user.district)} District Admin`
    : 'Welcome back';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex">
        <AdminSidebar items={DISTRICT_NAV} />
        <div className="flex-1 min-w-0 p-4 sm:p-8 pb-24 md:pb-8">
          <StatCardsSkeleton />
          <SkeletonBar className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      <AdminSidebar items={DISTRICT_NAV} />

      <div className="flex-1 min-w-0">
        <PageHeader
          role="admin"
          title={isDashboard ? `${greeting} 👋` : activeType.label}
          shortTitle={isDashboard ? '' : activeType.label}
          subtitle={user.district ? `${titleCase(user.district)} — തീരുമാനിച്ച അപേക്ഷകൾ മാത്രം (view only)` : 'District Admin'}
          count={rows.length}
        />

        <div className="p-4 sm:p-8 lg:p-10 pb-24 md:pb-10 max-w-[1440px] mx-auto">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
            <div className="relative col-span-2 xl:col-span-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="പേര് തിരയുക…"
                className={searchCls}
              />
            </div>
            <SelectField name="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
              {PERIODS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </SelectField>
            <SelectField name="formType" value={formType} onChange={(e) => setFormType(e.target.value)}>
              <option value="all">എല്ലാ അപേക്ഷകളും</option>
              {FORM_TYPES.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </SelectField>
            <SelectField name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Approved + Rejected</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </SelectField>
            <SelectField name="area" value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="all">എല്ലാ ഏരിയകളും</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </SelectField>
          </div>

          {isDashboard && (
          <>
          {/* KPI cards — clicking one toggles the type filter */}
          <div className="grid grid-cols-2 xl:grid-cols-12 gap-3 sm:gap-6 mb-8">
            {FORM_TYPES.map(({ key, label, icon: Icon, color, bg }) => (
              <button
                key={key}
                onClick={() => setFormType(formType === key ? 'all' : key)}
                className={`group xl:col-span-3 text-left bg-white rounded-2xl border p-3.5 sm:p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  formType === key ? 'border-green-500' : 'border-[#E5E7EB]'
                }`}
                style={cardShadow}
              >
                <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
                <div className="flex items-center gap-2.5 sm:gap-3.5 mb-2.5 sm:mb-3.5">
                  <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[11px] sm:text-[12px] xl:text-[13px] font-medium text-[#6B7280] leading-tight">{label}</h3>
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight leading-none" style={{ color }}>
                      {stats.byType[key].total}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[10px] sm:text-[11px] border-t border-gray-100 pt-2.5 sm:pt-3 text-[#6B7280]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D4F]" />{stats.byType[key].approved}<span className="hidden sm:inline"> approved</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />{stats.byType[key].rejected}<span className="hidden sm:inline"> rejected</span>
                  </span>
                  <span className="font-semibold text-[#111827]">{inr(stats.byType[key].amount)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
            <div className="xl:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8" style={cardShadow}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#111827] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#2E7D4F]" />
                  Decided Applications Trend
                </h2>
                <span className="text-xs font-medium text-[#6B7280] border border-[#E5E7EB] rounded-full px-3 py-1.5">
                  This Year
                </span>
              </div>
              <TrendChart counts={monthlyCounts} />
            </div>

            <div className="xl:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 flex items-center gap-4" style={cardShadow}>
                <span className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-[#111827] leading-none">{inr(stats.agg.amount)}</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    അനുവദിച്ച ആകെ തുക{stats.agg.paid ? ` · നൽകിയത് ${inr(stats.agg.paid)}` : ''}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 flex-1" style={cardShadow}>
                <h2 className="text-xl font-semibold text-[#111827] mb-4">Status Distribution</h2>
                <div className="flex flex-wrap items-center justify-center gap-6">
                  <DonutChart {...stats.agg} />
                  <StatusLegend {...stats.agg} />
                </div>
              </div>
            </div>
          </div>
          </>
          )}

          {!isDashboard && (
            <div className="flex flex-wrap items-center gap-2 mb-6 text-xs font-medium">
              {[
                ['Total', stats.byType[formType].total, 'bg-gray-100 text-gray-700'],
                ['Approved', stats.byType[formType].approved, 'bg-green-50 text-green-700'],
                ['Rejected', stats.byType[formType].rejected, 'bg-red-50 text-red-700'],
                ['Sanctioned', inr(stats.byType[formType].amount), 'bg-emerald-50 text-emerald-700'],
              ].map(([label, n, cls]) => (
                <span key={label} className={`px-3 py-1.5 rounded-full ${cls}`}>{label}: {n}</span>
              ))}
            </div>
          )}

          {/* Table */}
          {rows.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-[#6B7280]" style={cardShadow}>
              തീരുമാനിച്ച അപേക്ഷകൾ ഒന്നുമില്ല
            </div>
          ) : (
            <>
            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
              {rows.map((s) => (
                <button
                  key={s._id}
                  onClick={() => navigate(`/district-submissions/${s._id}`)}
                  className="w-full text-left bg-white rounded-2xl border border-[#E5E7EB] p-4"
                  style={cardShadow}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-800 truncate">{s.applicantName || '—'}</p>
                    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold capitalize flex-shrink-0 ${statusBadge(s.status)}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                    <span>{FORM_TYPES.find((f) => f.key === s.formType)?.label || s.formType}</span>
                    {s.area && <><span>·</span><span>{s.area}</span></>}
                    <span>·</span>
                    <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    {s.status === 'approved' && (
                      <><span>·</span><span className="text-emerald-700 font-semibold">{inr(s.approvedAmount)}</span></>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop / tablet: table */}
            <div className="hidden md:block bg-white rounded-2xl border border-[#E5E7EB] overflow-x-auto" style={cardShadow}>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3">പേര്</th>
                    <th className="px-4 py-3">അപേക്ഷ</th>
                    <th className="px-4 py-3">ഏരിയ</th>
                    <th className="px-4 py-3">സ്റ്റാറ്റസ്</th>
                    <th className="px-4 py-3">അനുവദിച്ച തുക</th>
                    <th className="px-4 py-3">തീയതി</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr
                      key={s._id}
                      onClick={() => navigate(`/district-submissions/${s._id}`)}
                      className="border-t hover:bg-emerald-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{s.applicantName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {FORM_TYPES.find((f) => f.key === s.formType)?.label || s.formType}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.area || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {s.status === 'approved' ? inr(s.approvedAmount) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistrictAdminHome;
