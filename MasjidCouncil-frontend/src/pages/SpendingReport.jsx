import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, Download, MapPin, RotateCcw } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import PageHeader from '../components/PageHeader';
import SelectField from '../components/SelectField';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FORM_TYPE_LABELS = {
  welfarefund: 'Welfare Fund — ഇമാം മുഅദ്ദിൻ ക്ഷേമനിധി (IMF)',
  mosquefund: 'Masjid Fund — മസ്ജിദ് ഫണ്ട്',
  affiliation: 'Affiliation — അഫിലിയേഷൻ',
  khateeb: 'Khateeb — ഖത്തീബ് രജിസ്ട്രേഷൻ',
};

const rupees = (n) => `₹ ${(n || 0).toLocaleString('en-IN')}`;

// Local YYYY-MM-DD — toISOString() would shift the day for IST users.
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const prettyDate = (value) =>
  new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// Quick ranges — each returns [from, to] as YYYY-MM-DD, or ['', ''] for "everything".
const PRESETS = [
  { key: 'all', label: 'എല്ലാം', range: () => ['', ''] },
  {
    key: 'month',
    label: 'ഈ മാസം',
    range: () => {
      const n = new Date();
      return [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(n)];
    },
  },
  {
    key: 'days30',
    label: '30 ദിവസം',
    range: () => {
      const n = new Date();
      const start = new Date(n);
      start.setDate(start.getDate() - 29);
      return [iso(start), iso(n)];
    },
  },
  {
    key: 'year',
    label: 'ഈ വർഷം',
    range: () => {
      const n = new Date();
      return [iso(new Date(n.getFullYear(), 0, 1)), iso(n)];
    },
  },
];

// Approved-budget report per form type, filterable by date range, location and scheme.
// role: 'admin' | 'superadmin'
const SpendingReport = ({ role }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem(role === 'superadmin' ? 'superAdminToken' : 'adminToken');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  const [formType, setFormType] = useState(''); // '' = every scheme
  const [districts, setDistricts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // master-data responds { districts: [{id, title}] } / { areas: [{id, title}] }
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/master-data/districts`)
      .then((r) => r.json())
      .then((d) => setDistricts(d.districts || []))
      .catch(() => {});
  }, []);

  // Areas depend on the chosen district; clearing the district clears the area with it.
  useEffect(() => {
    setArea('');
    if (!district) {
      setAreas([]);
      return;
    }
    const match = districts.find((d) => d.title === district);
    if (!match) return;
    fetch(`${API_BASE_URL}/api/master-data/areas/${match.id}`)
      .then((r) => r.json())
      .then((d) => setAreas(d.areas || []))
      .catch(() => setAreas([]));
  }, [district, districts]);

  useEffect(() => {
    if (!token) {
      navigate(role === 'superadmin' ? '/superadmin-login' : '/admin-login');
      return;
    }
    setLoading(true);
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    if (district) query.set('district', district);
    if (area) query.set('area', area);
    fetch(`${API_BASE_URL}/api/submissions/stats/spending?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setRows(d.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, district, area]);

  // Scheme filter is applied client-side — the response is 4 rows, a round trip buys nothing.
  const visible = useMemo(
    () => (formType ? rows.filter((r) => r._id === formType) : rows),
    [rows, formType]
  );
  const shownTypes = formType ? [formType] : Object.keys(FORM_TYPE_LABELS);

  const byType = useMemo(() => Object.fromEntries(visible.map((r) => [r._id, r])), [visible]);
  const totals = useMemo(
    () =>
      visible.reduce(
        (acc, r) => ({
          approvedCount: acc.approvedCount + (r.approvedCount || 0),
          totalApproved: acc.totalApproved + (r.totalApproved || 0),
          totalRequested: acc.totalRequested + (r.totalRequested || 0),
          totalPaid: acc.totalPaid + (r.totalPaid || 0),
          paidCount: acc.paidCount + (r.paidCount || 0),
        }),
        { approvedCount: 0, totalApproved: 0, totalRequested: 0, totalPaid: 0, paidCount: 0 }
      ),
    [visible]
  );

  const activePreset = PRESETS.find(({ range }) => {
    const [f, t] = range();
    return f === from && t === to;
  })?.key;

  const dirty = from || to || district || area || formType;

  const rangeLabel = from && to
    ? `${prettyDate(from)} – ${prettyDate(to)}`
    : from
      ? `${prettyDate(from)} മുതൽ`
      : to
        ? `${prettyDate(to)} വരെ`
        : 'എല്ലാ കാലയളവും';

  const placeLabel = [area, district].filter(Boolean).join(', ');

  const clearAll = () => {
    setFrom('');
    setTo('');
    setDistrict('');
    setFormType('');
  };

  // ponytail: hand-rolled CSV — 4 rows of plain numbers, a csv library would be heavier than the loop.
  const exportCsv = () => {
    const lines = [
      ['Scheme', 'Approved', 'Requested', 'Sanctioned', 'Paid', 'Balance'],
      ...shownTypes.map((type) => [
        FORM_TYPE_LABELS[type],
        byType[type]?.approvedCount || 0,
        byType[type]?.totalRequested || 0,
        byType[type]?.totalApproved || 0,
        byType[type]?.totalPaid || 0,
        (byType[type]?.totalApproved || 0) - (byType[type]?.totalPaid || 0),
      ]),
      [
        'Total',
        totals.approvedCount,
        totals.totalRequested,
        totals.totalApproved,
        totals.totalPaid,
        totals.totalApproved - totals.totalPaid,
      ],
      [],
      ['Range', rangeLabel],
      ['District', district || 'All'],
      ['Area', area || 'All'],
    ];
    const csv = lines.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `spending-${from || 'all'}-${to || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      {role === 'superadmin' ? <SuperAdminSidebar /> : <AdminSidebar />}

      <div className="flex-1 min-w-0">
        <PageHeader
          role={role}
          title="ചെലവ് റിപ്പോർട്ട് — Spending"
          shortTitle="Spending"
          subtitle="അനുവദിച്ച തുകകളുടെ കണക്ക്"
        />

        <div className="p-4 sm:p-8 lg:p-10 pb-24 md:pb-10 max-w-[1440px] mx-auto space-y-5">
          {/* Filters */}
          <div className="print-hide bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map(({ key, label, range }) => (
                <button
                  key={key}
                  onClick={() => {
                    const [f, t] = range();
                    setFrom(f);
                    setTo(t);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activePreset === key
                      ? 'bg-[#1F6B3A] text-white'
                      : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                {dirty && (
                  <button
                    onClick={clearAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    ക്ലിയർ
                  </button>
                )}
                <button
                  onClick={exportCsv}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-700 bg-white ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  <CalendarRange className="w-3.5 h-3.5" /> മുതൽ (From)
                </label>
                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-[0.7rem] text-sm bg-white text-gray-900 outline-none focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  <CalendarRange className="w-3.5 h-3.5" /> വരെ (To)
                </label>
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-[0.7rem] text-sm bg-white text-gray-900 outline-none focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> ജില്ല
                </label>
                <SelectField name="district" value={district} onChange={(e) => setDistrict(e.target.value)}>
                  <option value="">എല്ലാ ജില്ലയും</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.title}>{d.title}</option>
                  ))}
                </SelectField>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> ഏരിയ
                </label>
                <SelectField
                  name="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  disabled={!district}
                  placeholder={district ? 'എല്ലാ ഏരിയയും' : 'ജില്ല തിരഞ്ഞെടുക്കുക'}
                >
                  <option value="">എല്ലാ ഏരിയയും</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.title}>{a.title}</option>
                  ))}
                </SelectField>
              </div>
            </div>

            {/* Scheme filter — narrows the grand total to one fund */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mt-3 mr-1">പദ്ധതി</span>
              {[['', 'എല്ലാം'], ...Object.entries(FORM_TYPE_LABELS)].map(([type, label]) => (
                <button
                  key={type || 'all'}
                  onClick={() => setFormType(type)}
                  className={`mt-3 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    formType === type
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300'
                      : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {label.split(' — ')[0]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading…</div>
          ) : (
            <>
              {/* Grand total */}
              <div className="bg-[#1F6B3A] text-white rounded-2xl p-6 grid gap-5 sm:grid-cols-3 sm:items-end">
                <div className="sm:col-span-2">
                  <p className="text-sm opacity-80">ആകെ അനുവദിച്ച തുക — {rangeLabel}</p>
                  <p className="text-3xl font-bold mt-1 tabular-nums">{rupees(totals.totalApproved)}</p>
                  <p className="text-xs opacity-80 mt-2">
                    {totals.approvedCount} approved applications • requested {rupees(totals.totalRequested)}
                    {placeLabel && ` • ${placeLabel}`}
                  </p>
                </div>
                <div className="border-t sm:border-t-0 sm:border-l border-white/20 pt-4 sm:pt-0 sm:pl-5">
                  <p className="text-xs opacity-70 uppercase tracking-wider font-semibold">നൽകിയത് — Paid</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">{rupees(totals.totalPaid)}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {totals.paidCount} paid • ബാക്കി {rupees(Math.max(0, totals.totalApproved - totals.totalPaid))}
                  </p>
                </div>
              </div>

              {/* Per form type */}
              <div className="grid sm:grid-cols-2 gap-4">
                {shownTypes.map((type) => {
                  const r = byType[type];
                  return (
                    <div key={type} className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                      <h3 className="font-semibold text-gray-800 text-sm mb-3">{FORM_TYPE_LABELS[type]}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-xs text-gray-500 block">Approved</span>
                          <span className="font-bold text-gray-800 tabular-nums">{r?.approvedCount || 0}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Requested</span>
                          <span className="font-semibold text-gray-700 tabular-nums">{rupees(r?.totalRequested)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Sanctioned</span>
                          <span className="font-bold text-emerald-700 tabular-nums">{rupees(r?.totalApproved)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Paid</span>
                          <span className="font-bold text-gray-900 tabular-nums">{rupees(r?.totalPaid)}</span>
                          <span className="text-[11px] text-gray-400 block tabular-nums">
                            ബാക്കി {rupees(Math.max(0, (r?.totalApproved || 0) - (r?.totalPaid || 0)))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400">
                അനുവദിച്ച (approved) അപേക്ഷകൾ മാത്രമാണ് ഈ കണക്കിൽ. തുക രേഖപ്പെടുത്താതെ
                അപ്രൂവ് ചെയ്തവ എണ്ണത്തിൽ വരും, തുകയിൽ വരില്ല.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpendingReport;
