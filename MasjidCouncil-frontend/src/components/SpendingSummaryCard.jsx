import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, IndianRupee } from 'lucide-react';
import { authHeaders } from '../lib/auth';
import { cachedJson } from '../lib/apiCache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SCHEMES = {
  welfarefund: 'Welfare Fund',
  mosquefund: 'Masjid Fund',
  affiliation: 'Affiliation',
  khateeb: "Mirqath '26",
};

const rupees = (n) => `₹ ${(n || 0).toLocaleString('en-IN')}`;

// All-time sanctioned total per scheme, with a jump to the full report.
// role: 'admin' | 'superadmin' — only decides which route the button lands on.
const SpendingSummaryCard = ({ role = 'admin' }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    cachedJson(`${API_BASE_URL}/api/submissions/stats/spending`, { headers: authHeaders() })
      .then((d) => alive && setRows(d.data || []))
      .catch(() => alive && setRows([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const byType = useMemo(() => Object.fromEntries(rows.map((r) => [r._id, r])), [rows]);
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          approvedCount: acc.approvedCount + (r.approvedCount || 0),
          totalApproved: acc.totalApproved + (r.totalApproved || 0),
          totalRequested: acc.totalRequested + (r.totalRequested || 0),
          totalPaid: acc.totalPaid + (r.totalPaid || 0),
          paidCount: acc.paidCount + (r.paidCount || 0),
        }),
        { approvedCount: 0, totalApproved: 0, totalRequested: 0, totalPaid: 0, paidCount: 0 }
      ),
    [rows]
  );

  const reportPath = role === 'superadmin' ? '/superadmin-spending-report' : '/spending-report';

  return (
    <div className="bg-[#1F6B3A] text-white rounded-2xl p-5 sm:p-6 mb-8 grid gap-5 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-5">
        <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-wider">
          <IndianRupee className="w-3.5 h-3.5" />
          ആകെ അനുവദിച്ച തുക
        </div>
        <p className="text-3xl sm:text-4xl font-bold tracking-tight mt-1.5 tabular-nums">
          {loading ? '—' : rupees(totals.totalApproved)}
        </p>
        <p className="text-xs text-white/70 mt-2">
          {totals.approvedCount} approved • requested {rupees(totals.totalRequested)}
        </p>
        <div className="mt-3 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs bg-white/10 rounded-xl px-3 py-2">
          <span className="text-white/70">നൽകിയത്</span>
          <span className="font-bold tabular-nums">{loading ? '—' : rupees(totals.totalPaid)}</span>
          <span className="text-white/50">•</span>
          <span className="text-white/70">
            ബാക്കി <span className="font-semibold tabular-nums">{rupees(Math.max(0, totals.totalApproved - totals.totalPaid))}</span>
          </span>
        </div>
      </div>

      {/* Per-scheme split — sanctioned over paid. Filters live on the report page. */}
      <div className="lg:col-span-5 grid grid-cols-2 gap-x-4 gap-y-3">
        {Object.entries(SCHEMES).map(([type, label]) => (
          <div key={type} className="min-w-0">
            <p className="text-[11px] text-white/60 truncate">{label}</p>
            <p className="text-sm font-semibold tabular-nums truncate">
              {loading ? '—' : rupees(byType[type]?.totalApproved)}
            </p>
            <p className="text-[11px] text-white/60 tabular-nums truncate">
              paid {loading ? '—' : rupees(byType[type]?.totalPaid)}
            </p>
          </div>
        ))}
      </div>

      <div className="lg:col-span-2 lg:justify-self-end">
        <button
          onClick={() => navigate(reportPath)}
          className="group w-full lg:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 ring-1 ring-white/25 text-sm font-semibold transition-colors"
        >
          ചെലവ് റിപ്പോർട്ട്
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default SpendingSummaryCard;
