import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SubmissionData } from './SubmissionDetails';
import SubmissionAttachments from '../components/SubmissionAttachments';
import AdminSidebar from '../components/AdminSidebar';
import PageHeader from '../components/PageHeader';
import { SkeletonBar } from '../components/Skeleton';
import { cachedJson, peekJson } from '../lib/apiCache';
import { DISTRICT_NAV } from './DistrictAdminHome';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const inr = (n) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);

const PAID_METHOD_LABELS = { bank: 'ബാങ്ക്', cheque: 'ചെക്ക്', cash: 'ക്യാഷ്', upi: 'UPI' };

// Strictly read-only view for district admins. Server only serves decided
// (approved / rejected) submissions of the admin's own district.
const DistrictSubmissionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const detailUrl = `${API_BASE_URL}/api/district/submissions/${id}`;
  const cached = peekJson(detailUrl);
  const [submission, setSubmission] = useState(cached?.data || null);
  const [config, setConfig] = useState(cached?.config || null);
  const [loading, setLoading] = useState(!cached);

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
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex">
        <AdminSidebar items={DISTRICT_NAV} />
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

  const approved = submission.status === 'approved';

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      <AdminSidebar items={DISTRICT_NAV} />
      <div className="flex-1 min-w-0">
      <PageHeader role="admin" title="അപേക്ഷ വിശദാംശങ്ങൾ" shortTitle="" />
      <div className="p-4 sm:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/district-home')} className="text-sm text-gray-500 hover:text-gray-800 mb-2">← List</button>

        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-800">{submission.applicantName || config?.title}</h1>
              <p className="text-xs text-gray-500">
                {submission.district} {submission.area && `• ${submission.area}`} •{' '}
                {new Date(submission.createdAt).toLocaleString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
              {submission.status}
            </span>
          </div>

          <SubmissionData config={config} submission={submission} />

          <SubmissionAttachments config={config} submission={submission} />
        </div>

        {/* Decision summary — the part a district admin is here for */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-4">
          <h2 className="font-bold text-gray-800 mb-3">തീരുമാനം</h2>
          {approved ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-gray-800 space-y-1">
              <p><b>അനുവദിച്ച തുക:</b> {inr(submission.approvedAmount)}</p>
              {submission.approvedAt && (
                <p><b>അനുവദിച്ച തീയതി:</b> {new Date(submission.approvedAt).toLocaleDateString()}</p>
              )}
              {submission.paidAmount != null && (
                <p>
                  <b>നൽകിയ തുക:</b> {inr(submission.paidAmount)}
                  {submission.paidMethod && ` (${PAID_METHOD_LABELS[submission.paidMethod] || submission.paidMethod})`}
                  {submission.paidAt && ` — ${new Date(submission.paidAt).toLocaleDateString()}`}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              <b>നിരസിച്ചു{submission.rejectionReason ? ' — കാരണം:' : ''}</b>{' '}
              {submission.rejectionReason || ''}
            </div>
          )}
        </div>

        {/* Area president's recommendation (read-only) */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <h2 className="font-bold text-gray-800 mb-2">ജമാഅത്തെ ഇസ്ലാമി ഏരിയാ പ്രസിഡന്റിന്റെ ശുപാർശ</h2>
          {submission.areaVerification?.comment ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.areaVerification.comment}</p>
              {Object.entries(submission.areaVerification.extra || {}).map(([k, v]) => (
                <p key={k} className="text-sm text-gray-800 mt-1"><b>{k}</b> {v}</p>
              ))}
              <p className="text-xs text-gray-500 mt-2">
                — {submission.areaVerification.verifiedByName},{' '}
                {new Date(submission.areaVerification.verifiedAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">ഏരിയ വെരിഫിക്കേഷൻ ഇല്ല.</p>
          )}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default DistrictSubmissionDetails;
