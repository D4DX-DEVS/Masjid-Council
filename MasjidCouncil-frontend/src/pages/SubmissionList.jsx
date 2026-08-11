import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

// Generic submissions list for dynamic forms. role: 'admin' | 'superadmin'
const SubmissionList = ({ role }) => {
  const { formType } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem(role === 'superadmin' ? 'superAdminToken' : 'adminToken');
  const base = role === 'superadmin' ? '/superadmin-submissions' : '/submissions';

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token) {
      navigate(role === 'superadmin' ? '/superadmin-login' : '/admin-login');
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (status !== 'all') query.set('status', status);
        if (search) query.set('search', search);
        const res = await fetch(`${API_BASE_URL}/api/submissions/${formType}?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSubmissions(data.data || []);
      } catch {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formType, status, search]);

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      {role === 'superadmin' ? <SuperAdminSidebar /> : <AdminSidebar />}

      <div className="flex-1 min-w-0">
        <PageHeader
          role={role}
          title={`${FORM_TYPE_LABELS[formType] || formType} — അപേക്ഷകൾ`}
          shortTitle="Submissions"
          subtitle="Dynamic form submissions"
        />

        <div className="p-4 sm:p-8 lg:p-10 pb-24 md:pb-10 max-w-[1440px] mx-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(FORM_TYPE_LABELS).map(([k, v]) => (
              <button key={k} onClick={() => navigate(`${base}/${k}`)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${k === formType ? 'bg-[#1F6B3A] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
                {v}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="w-48">
              <SelectField name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">എല്ലാ സ്റ്റാറ്റസും</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </SelectField>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="പേര് / ഫോൺ തിരയുക"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm flex-1 min-w-[12rem] bg-white outline-none focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15 transition-all"
            />
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading…</div>
          ) : submissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-gray-500">
              അപേക്ഷകൾ ഒന്നുമില്ല
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3">പേര്</th>
                    <th className="px-4 py-3">ജില്ല</th>
                    <th className="px-4 py-3">ഏരിയ</th>
                    <th className="px-4 py-3">ഏരിയ വെരിഫിക്കേഷൻ</th>
                    <th className="px-4 py-3">സ്റ്റാറ്റസ്</th>
                    <th className="px-4 py-3">തീയതി</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr
                      key={s._id}
                      onClick={() => navigate(`${base}/${formType}/${s._id}`)}
                      className="border-t hover:bg-emerald-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{s.applicantName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.district || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.area || '—'}</td>
                      <td className="px-4 py-3">
                        {s.areaVerification?.comment ? (
                          <span className="text-emerald-700 text-xs font-semibold">✔ Verified</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[s.status] || ''}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionList;
