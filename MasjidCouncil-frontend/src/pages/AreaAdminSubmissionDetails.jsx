import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SubmissionData } from './SubmissionDetails';
import SubmissionAttachments from '../components/SubmissionAttachments';
import AdminSidebar from '../components/AdminSidebar';
import PageHeader from '../components/PageHeader';
import { SkeletonBar } from '../components/Skeleton';
import { cachedJson, peekJson, invalidate } from '../lib/apiCache';
import { AREA_NAV } from './AreaAdminHome';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Read-only view for area admins + verification comment box. No status actions.
const AreaAdminSubmissionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const detailUrl = `${API_BASE_URL}/api/area/submissions/${id}`;
  const cached = peekJson(detailUrl);
  const [submission, setSubmission] = useState(cached?.data || null);
  const [config, setConfig] = useState(cached?.config || null);
  const [loading, setLoading] = useState(!cached);
  const [comment, setComment] = useState('');
  const [extra, setExtra] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/admin-login');
      return;
    }
    cachedJson(detailUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((d) => {
        if (d.success) {
          setSubmission(d.data);
          setConfig(d.config);
          setComment(d.data.areaVerification?.comment || '');
          setExtra(d.data.areaVerification?.extra || {});
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
        body: JSON.stringify({ comment, extra }),
      });
      const data = await res.json();
      if (data.success) {
        invalidate(); // list + detail caches now hold the old verification
        setSubmission(data.data);
        setEditing(false);
        setMessage('ശുപാർശ സേവ് ചെയ്തു ✔ അഡ്മിൻ / സൂപ്പർ അഡ്മിൻ ഇപ്പോൾ ഇത് കാണും.');
      } else {
        setMessage(data.message || 'Failed');
      }
    } catch {
      setMessage('Failed');
    } finally {
      setSaving(false);
    }
    // ponytail: auto-hide so a repeat save visibly re-flashes instead of looking dead
    setTimeout(() => setMessage(''), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex">
        <AdminSidebar items={AREA_NAV} />
        <div className="flex-1 min-w-0">
          <PageHeader role="admin" title="അപേക്ഷ വിശദാംശങ്ങൾ" shortTitle="" />
          <div className="p-4 sm:p-8 pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto space-y-4">
              <SkeletonBar className="h-6 w-40 rounded-lg" />
              <SkeletonBar className="h-72 w-full rounded-xl" />
              <SkeletonBar className="h-44 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!submission) return <div className="min-h-screen flex items-center justify-center text-gray-500">Submission not found</div>;

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      <AdminSidebar items={AREA_NAV} />
      <div className="flex-1 min-w-0">
      <PageHeader role="admin" title="അപേക്ഷ വിശദാംശങ്ങൾ" shortTitle="" />
      <div className="p-4 sm:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/area-home')} className="text-sm text-gray-500 hover:text-gray-800 mb-2">← List</button>

        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-4">
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

          <SubmissionAttachments config={config} submission={submission} />
        </div>

        {/* Verification comment */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <h2 className="font-bold text-gray-800 mb-1">ശുപാർശ / വെരിഫിക്കേഷൻ കുറിപ്പ്</h2>
          <p className="text-xs text-gray-500 mb-3 whitespace-pre-wrap">
            {config?.areaVerificationHint ||
              'അപേക്ഷ നേരിട്ട് പരിശോധിച്ചതിന് ശേഷം നിങ്ങളുടെ ശുപാർശ ഇവിടെ രേഖപ്പെടുത്തുക. ഇത് അഡ്മിൻ / സൂപ്പർ അഡ്മിൻ കാണും.'}
          </p>
          {submission.areaVerification?.comment && !editing ? (
            /* Already verified — read-only view; edit only on demand */
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-emerald-800 mb-1">
                  ✔ വെരിഫൈ ചെയ്തു — {new Date(submission.areaVerification.verifiedAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.areaVerification.comment}</p>
                {Object.entries(submission.areaVerification.extra || {}).map(([k, v]) => (
                  <p key={k} className="text-sm text-gray-800 mt-1"><b>{k}</b> {v}</p>
                ))}
              </div>
              {message && (
                <div className="mt-2 rounded-lg px-4 py-2.5 text-sm font-medium bg-emerald-50 border border-emerald-200 text-emerald-800">
                  {message}
                </div>
              )}
              <button
                onClick={() => { setComment(submission.areaVerification.comment); setExtra(submission.areaVerification.extra || {}); setEditing(true); setMessage(''); }}
                className="mt-3 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
              >
                ശുപാർശ എഡിറ്റ് ചെയ്യുക
              </button>
            </>
          ) : (
            <>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={4}
                placeholder="ഉദാ: ഈ അപേക്ഷ ഞാൻ നേരിട്ട് പരിശോധിച്ചു. ഈ വ്യക്തിക്ക് യഥാർത്ഥത്തിൽ ഈ സഹായം ആവശ്യമാണ്…"
                value={comment}
                onChange={(e) => { setComment(e.target.value); setMessage(''); }}
              />
              {(config?.areaVerificationFields || []).map((label) => (
                <label key={label} className="block mt-2">
                  <span className="text-sm text-gray-600">{label}</span>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    value={extra[label] || ''}
                    onChange={(e) => { setExtra((x) => ({ ...x, [label]: e.target.value })); setMessage(''); }}
                  />
                </label>
              ))}
              {message && (
                <div className={`mt-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
                  message.startsWith('ശുപാർശ') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={saveVerification}
                  disabled={saving || !comment.trim()}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'സേവ് ചെയ്യുന്നു…' : submission.areaVerification?.comment ? 'ശുപാർശ പുതുക്കുക' : 'വെരിഫൈ ചെയ്ത് ശുപാർശ സേവ് ചെയ്യുക'}
                </button>
                {editing && (
                  <button
                    onClick={() => { setEditing(false); setMessage(''); }}
                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
                  >
                    റദ്ദാക്കുക
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default AreaAdminSubmissionDetails;
