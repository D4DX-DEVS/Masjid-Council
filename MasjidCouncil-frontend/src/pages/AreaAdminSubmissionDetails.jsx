import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SubmissionData } from './SubmissionDetails';
import AdminSidebar from '../components/AdminSidebar';
import PageHeader from '../components/PageHeader';
import { AREA_NAV } from './AreaAdminHome';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Read-only view for area admins + verification comment box. No status actions.
const AreaAdminSubmissionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const [submission, setSubmission] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/admin-login');
      return;
    }
    fetch(`${API_BASE_URL}/api/area/submissions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSubmission(d.data);
          setConfig(d.config);
          setComment(d.data.areaVerification?.comment || '');
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveVerification = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/area/submissions/${id}/verify`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmission(data.data);
        setMessage('ശുപാർശ സേവ് ചെയ്തു ✔');
      } else {
        setMessage(data.message || 'Failed');
      }
    } catch {
      setMessage('Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!submission) return <div className="min-h-screen flex items-center justify-center text-gray-500">Submission not found</div>;

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      <AdminSidebar items={AREA_NAV} />
      <div className="flex-1 min-w-0">
      <PageHeader role="admin" title="അപേക്ഷ വിശദാംശങ്ങൾ" shortTitle="" />
      <div className="p-4 sm:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/area-home')} className="text-sm text-gray-500 hover:text-gray-800 mb-2">← List</button>

        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-800">{submission.applicantName || config?.title}</h1>
              <p className="text-xs text-gray-500">
                {submission.district} {submission.area && `• ${submission.area}`} •{' '}
                {new Date(submission.createdAt).toLocaleString()}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              {submission.status}
            </span>
          </div>

          <SubmissionData config={config} submission={submission} />
        </div>

        {/* Verification comment */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-800 mb-1">ശുപാർശ / വെരിഫിക്കേഷൻ കുറിപ്പ്</h2>
          <p className="text-xs text-gray-500 mb-3">
            അപേക്ഷ നേരിട്ട് പരിശോധിച്ചതിന് ശേഷം നിങ്ങളുടെ ശുപാർശ ഇവിടെ രേഖപ്പെടുത്തുക.
            ഇത് അഡ്മിൻ / സൂപ്പർ അഡ്മിൻ കാണും.
          </p>
          {submission.areaVerification?.verifiedAt && (
            <p className="text-xs text-emerald-700 mb-2">
              ✔ വെരിഫൈ ചെയ്തത്: {new Date(submission.areaVerification.verifiedAt).toLocaleString()}
            </p>
          )}
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={4}
            placeholder="ഉദാ: ഈ അപേക്ഷ ഞാൻ നേരിട്ട് പരിശോധിച്ചു. ഈ വ്യക്തിക്ക് യഥാർത്ഥത്തിൽ ഈ സഹായം ആവശ്യമാണ്…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {message && <p className="text-sm text-emerald-700 mt-2">{message}</p>}
          <button
            onClick={saveVerification}
            disabled={saving || !comment.trim()}
            className="mt-3 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'സേവ് ചെയ്യുന്നു…' : submission.areaVerification?.comment ? 'ശുപാർശ പുതുക്കുക' : 'വെരിഫൈ ചെയ്ത് ശുപാർശ സേവ് ചെയ്യുക'}
          </button>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default AreaAdminSubmissionDetails;
