import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const rupees = (n) => `₹ ${(n || 0).toLocaleString('en-IN')}`;

// Approved-budget report per form type, filterable by year/month. role: 'admin' | 'superadmin'
const SpendingReport = ({ role }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem(role === 'superadmin' ? 'superAdminToken' : 'adminToken');

  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState('all'); // 1-12 or 'all'
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // seed years from current year back — dynamic forms did not exist before 2026
  const years = useMemo(() => {
    const list = [];
    for (let y = now.getFullYear(); y >= 2026; y--) list.push(String(y));
    return list.length ? list : [String(now.getFullYear())];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) {
      navigate(role === 'superadmin' ? '/superadmin-login' : '/admin-login');
      return;
    }
    setLoading(true);
    const query = new URLSearchParams();
    if (year !== 'all') query.set('year', year);
    if (year !== 'all' && month !== 'all') query.set('month', month);
    fetch(`${API_BASE_URL}/api/submissions/stats/spending?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setRows(d.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const byType = useMemo(
    () => Object.fromEntries(rows.map((r) => [r._id, r])),
    [rows]
  );
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          approvedCount: acc.approvedCount + (r.approvedCount || 0),
          totalApproved: acc.totalApproved + (r.totalApproved || 0),
          totalRequested: acc.totalRequested + (r.totalRequested || 0),
        }),
        { approvedCount: 0, totalApproved: 0, totalRequested: 0 }
      ),
    [rows]
  );

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

        <div className="p-4 sm:p-8 lg:p-10 pb-24 md:pb-10 max-w-[1440px] mx-auto">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="w-40">
              <SelectField name="year" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </SelectField>
            </div>
            <div className="w-48">
              <SelectField
                name="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={year === 'all'}
              >
                <option value="all">All months</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1)}>{m}</option>
                ))}
              </SelectField>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading…</div>
          ) : (
            <>
              {/* Grand total */}
              <div className="bg-[#1F6B3A] text-white rounded-2xl p-6 mb-6">
                <p className="text-sm opacity-80">
                  ആകെ അനുവദിച്ച തുക {year !== 'all' && `— ${year}`}{' '}
                  {year !== 'all' && month !== 'all' && MONTHS[Number(month) - 1]}
                </p>
                <p className="text-3xl font-bold mt-1">{rupees(totals.totalApproved)}</p>
                <p className="text-xs opacity-80 mt-2">
                  {totals.approvedCount} approved applications • requested {rupees(totals.totalRequested)}
                </p>
              </div>

              {/* Per form type */}
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(FORM_TYPE_LABELS).map(([type, label]) => {
                  const r = byType[type];
                  return (
                    <div key={type} className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                      <h3 className="font-semibold text-gray-800 text-sm mb-3">{label}</h3>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-xs text-gray-500 block">Approved</span>
                          <span className="font-bold text-gray-800">{r?.approvedCount || 0}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Requested</span>
                          <span className="font-semibold text-gray-700">{rupees(r?.totalRequested)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Sanctioned</span>
                          <span className="font-bold text-emerald-700">{rupees(r?.totalApproved)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400 mt-6">
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
