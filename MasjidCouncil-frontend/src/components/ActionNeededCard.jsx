import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { cachedJson } from '../lib/apiCache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TYPE_LABELS = {
  welfarefund: 'Welfare Fund',
  mosquefund: 'Masjid Fund',
  affiliation: 'Affiliation',
  khateeb: 'Khateeb',
};

// Dashboard card: submissions the area admin has verified that still await an
// admin decision. Clicking a chip opens that form's submissions list; clicking
// a row opens the request itself. Renders nothing when there is nothing to act on.
const ActionNeededCard = ({ role }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem(role === 'superadmin' ? 'superAdminToken' : 'adminToken');
  const base = role === 'superadmin' ? '/superadmin-submissions' : '/submissions';
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!token) return;
    cachedJson(`${API_BASE_URL}/api/submissions/stats/action-needed`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((d) => d.success && setData(d.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = (data?.counts || []).reduce((n, c) => n + c.count, 0);
  if (!total) return null;

  return (
    <div className="bg-white rounded-2xl border border-amber-200 p-5 sm:p-6 mb-8" style={{ boxShadow: '0 6px 24px rgba(0,0,0,.04)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          </span>
          <div>
            <h2 className="font-bold text-gray-800 leading-tight">ഏരിയ വെരിഫൈ ചെയ്തു — തീരുമാനത്തിന് കാത്തിരിക്കുന്നു</h2>
            <p className="text-xs text-gray-500">{total} അപേക്ഷ(കൾ) നടപടിക്ക് തയ്യാർ</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(data.counts || []).map((c) => (
            <button
              key={c._id}
              onClick={() => navigate(`${base}/${c._id}`)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              {TYPE_LABELS[c._id] || c._id}: {c.count}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {(data.recent || []).map((s) => (
          <button
            key={s._id}
            onClick={() => navigate(`${base}/${s.formType}/${s._id}`)}
            className="w-full text-left flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5 hover:bg-amber-50/60 rounded-lg px-2 transition-colors"
          >
            <span className="font-medium text-gray-800 text-sm truncate">{s.applicantName || '—'}</span>
            <span className="text-xs text-gray-500">
              {TYPE_LABELS[s.formType] || s.formType} · {s.area || s.district || ''} · ✔{' '}
              {s.areaVerification?.verifiedByName}
              {s.areaVerification?.verifiedAt && `, ${new Date(s.areaVerification.verifiedAt).toLocaleDateString()}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActionNeededCard;
