import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { STRUCTURAL_TYPES, isEmptyValue } from '../components/DynamicFieldRenderer';
import AdminSidebar from '../components/AdminSidebar';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import PageHeader from '../components/PageHeader';
import SelectField from '../components/SelectField';
import DateField from '../components/DateField';
import { usePdfExport } from '../hooks/usePdfExport';
import { invalidate } from '../lib/apiCache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Read-only value renderer for one field of a submission
export const FieldValue = ({ field, value }) => {
  if (isEmptyValue(value)) return <span className="text-gray-400">—</span>;

  if (field.type === 'file' && typeof value === 'string') {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="text-emerald-700 underline">
        ഫയൽ കാണുക
      </a>
    );
  }

  if (field.type === 'row' && Array.isArray(value)) {
    return (
      <div className="overflow-x-auto border border-gray-200 rounded-lg mt-1">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {(field.columnTitles || []).map((t, i) => (
                <th key={i} className="px-2 py-1.5 text-left font-semibold text-gray-600 border-b">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value
              .filter((row) => Array.isArray(row) && row.some((c) => !isEmptyValue(c)))
              .map((row, r) => (
                <tr key={r} className="border-b last:border-b-0">
                  {row.map((cell, c) => (
                    <td key={c} className="px-2 py-1.5 text-gray-700">{cell || '—'}</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (Array.isArray(value)) return <span>{value.join(', ')}</span>;
  if (field.type === 'yesno') return <span>{value === 'yes' ? 'ഉണ്ട് / അതെ' : 'ഇല്ല'}</span>;
  return <span className="whitespace-pre-wrap">{String(value)}</span>;
};

// Shared read-only walk of the submission's formData using its config
export const SubmissionData = ({ config, submission }) => (
  <>
    {[...(config?.pages || [])]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((page) => (
        <div key={page.id} className="mb-6">
          <h3 className="font-bold text-emerald-800 border-b border-emerald-100 pb-1 mb-3">{page.title}</h3>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {(page.fields || [])
              .filter((f) => !STRUCTURAL_TYPES.includes(f.type))
              .map((field) => (
                <div key={field.id} className={field.type === 'row' || field.type === 'textarea' ? 'sm:col-span-2 min-w-0' : 'min-w-0'}>
                  <dt className="text-xs text-gray-500">{field.label}</dt>
                  <dd className="text-sm text-gray-800 font-medium">
                    <FieldValue field={field} value={submission.formData?.[`field_${field.id}`]} />
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
  </>
);

// Payment is handed over off-platform; this only records how it was done.
const PAID_METHOD_LABELS = {
  bank: 'ബാങ്ക് ട്രാൻസ്ഫർ',
  cheque: 'ചെക്ക്',
  cash: 'ക്യാഷ്',
  upi: 'UPI',
};

const STATUS_LABELS = {
  pending: 'പെൻഡിംഗ് — Pending',
  under_review: 'പരിശോധനയിൽ — Under review',
  approved: 'അംഗീകരിച്ചു — Approved',
  rejected: 'നിരസിച്ചു — Rejected',
};

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

// role: 'admin' | 'superadmin'
const SubmissionDetails = ({ role }) => {
  const { formType, id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem(role === 'superadmin' ? 'superAdminToken' : 'adminToken');
  const listPath = `${role === 'superadmin' ? '/superadmin-submissions' : '/submissions'}/${formType}`;

  const [submission, setSubmission] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [officeComment, setOfficeComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [editingOffice, setEditingOffice] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paidDate, setPaidDate] = useState('');
  const [paidNote, setPaidNote] = useState('');
  const [paidMethod, setPaidMethod] = useState('');
  const [savingPaid, setSavingPaid] = useState(false);
  const [editingPaid, setEditingPaid] = useState(false);
  const [paidMessage, setPaidMessage] = useState('');
  const [message, setMessage] = useState('');
  const { contentRef, downloading, handleDownload } = usePdfExport(`submission-${formType}`);

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!token) {
      navigate(role === 'superadmin' ? '/superadmin-login' : '/admin-login');
      return;
    }
    fetch(`${API_BASE_URL}/api/submissions/${formType}/${id}`, { headers: authHeaders })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSubmission(d.data);
          setConfig(d.config);
          setOfficeComment(d.data.officeComment?.comment || '');
          fillPaid(d.data);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formType, id]);

  const changeStatus = async (status) => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      setShowReject(true);
      return;
    }
    const res = await fetch(`${API_BASE_URL}/api/submissions/${formType}/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status, rejectionReason, approvedAmount }),
    });
    const data = await res.json();
    if (data.success) {
      invalidate(); // list caches now hold a stale status
      setSubmission(data.data);
      setShowReject(false);
      setShowApprove(false);
      setMessage(data.message);
    } else {
      setMessage(data.message || 'Failed');
    }
  };

  // Local YYYY-MM-DD — toISOString() would shift the day for IST users.
  const isoDay = (value) => {
    const d = value ? new Date(value) : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const fillPaid = (s) => {
    setPaidAmount(s.paidAmount != null ? String(s.paidAmount) : '');
    setPaidDate(isoDay(s.paidAt));
    setPaidNote(s.paidNote || '');
    setPaidMethod(s.paidMethod || '');
  };

  // clear=true wipes the entry; otherwise the typed number is stored as-is.
  const savePaid = async (clear = false) => {
    setSavingPaid(true);
    const res = await fetch(`${API_BASE_URL}/api/submissions/${formType}/${id}/paid`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(
        clear ? { paidAmount: null } : { paidAmount, paidAt: paidDate, paidNote, paidMethod }
      ),
    });
    const data = await res.json();
    setSavingPaid(false);
    setPaidMessage(data.message || (data.success ? 'Saved' : 'Failed'));
    if (data.success) {
      invalidate(); // spending report + dashboard totals now hold a stale number
      setSubmission(data.data);
      fillPaid(data.data);
      setEditingPaid(false); // saved entry goes read-only until "edit" is pressed
    }
  };

  const saveOfficeComment = async () => {
    const res = await fetch(`${API_BASE_URL}/api/submissions/${formType}/${id}/office-comment`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ comment: officeComment }),
    });
    const data = await res.json();
    setMessage(data.success ? 'Office comment saved' : data.message || 'Failed');
    if (data.success) {
      invalidate();
      setSubmission(data.data);
      setEditingOffice(false);
    }
  };

  const shell = (content) => (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      {role === 'superadmin' ? <SuperAdminSidebar /> : <AdminSidebar />}
      <div className="flex-1 min-w-0">
        <PageHeader role={role} title="അപേക്ഷ വിശദാംശങ്ങൾ" shortTitle="Details" subtitle={config?.title || ''} />
        <div className="p-4 sm:p-8 lg:p-10 pb-24 md:pb-10 max-w-[1440px] mx-auto">{content}</div>
      </div>
    </div>
  );

  if (loading) return shell(<div className="text-center text-gray-500 py-16">Loading…</div>);
  if (!submission) return shell(<div className="text-center text-gray-500 py-16">Submission not found</div>);

  return shell(
    <>
      <div className="max-w-4xl mx-auto">
        <div className="print-hide flex flex-wrap items-center justify-between gap-2 mb-2">
          <button onClick={() => navigate(listPath)} className="text-sm text-gray-500 hover:text-gray-800">← List</button>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50"
            >
              🖨 Print
            </button>
            <button
              onClick={() => handleDownload(submission._id?.slice(-6), () => setMessage('PDF export failed'))}
              disabled={downloading}
              className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 disabled:opacity-50"
            >
              {downloading ? 'Preparing…' : '⬇ Download PDF'}
            </button>
          </div>
        </div>

        <div ref={contentRef}>
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-800">{submission.applicantName || config?.title}</h1>
              <p className="text-xs text-gray-500">
                {submission.district} {submission.area && `• ${submission.area}`} •{' '}
                {new Date(submission.createdAt).toLocaleString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[submission.status] || ''}`}>
              {submission.status}
            </span>
          </div>

          <SubmissionData config={config} submission={submission} />

          {(submission.requestedAmount != null || submission.approvedAmount != null) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
              <h3 className="text-sm font-bold text-gray-800 mb-2">ബഡ്ജറ്റ്</h3>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-500 block">പ്രതീക്ഷിക്കുന്ന ചെലവ്</span>
                  <span className="font-semibold text-gray-800">
                    {submission.requestedAmount != null ? `₹ ${submission.requestedAmount.toLocaleString('en-IN')}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">സ്വന്തമായി ശേഖരിക്കാവുന്നത്</span>
                  <span className="font-semibold text-gray-800">
                    {submission.ownContribution != null ? `₹ ${submission.ownContribution.toLocaleString('en-IN')}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">അനുവദിച്ച തുക</span>
                  <span className="font-semibold text-emerald-700">
                    {submission.approvedAmount != null ? `₹ ${submission.approvedAmount.toLocaleString('en-IN')}` : '—'}
                  </span>
                  {submission.approvedAt && (
                    <span className="text-xs text-gray-500 block">
                      {submission.approvedByName} — {new Date(submission.approvedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Paid entry — bookkeeping only, no payout happens here */}
          {submission.status === 'approved' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-gray-800">നൽകിയ തുക — Paid</h3>
                {submission.paidAmount != null && (
                  <span className="text-xs text-gray-500">
                    ബാക്കി {`₹ ${Math.max(0, (submission.approvedAmount || 0) - submission.paidAmount).toLocaleString('en-IN')}`}
                  </span>
                )}
              </div>

              {submission.paidAmount != null && (
                <p className="text-sm mb-3">
                  <span className="text-xl font-bold text-emerald-700">
                    ₹ {submission.paidAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-gray-500 block">
                    {submission.paidByName}
                    {submission.paidAt && ` — ${new Date(submission.paidAt).toLocaleDateString()}`}
                    {submission.paidMethod && ` • ${PAID_METHOD_LABELS[submission.paidMethod]}`}
                    {submission.paidNote && ` • ${submission.paidNote}`}
                  </span>
                </p>
              )}

              {paidMessage && <p className="print-hide text-sm text-emerald-700 mb-2">{paidMessage}</p>}

              {/* Saved entry is read-only — editing is a deliberate click, like the office note. */}
              {submission.paidAmount != null && !editingPaid ? (
                <div className="print-hide flex flex-wrap gap-2">
                  <button
                    onClick={() => { setPaidMessage(''); setEditingPaid(true); }}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50"
                  >
                    തുക എഡിറ്റ് ചെയ്യുക
                  </button>
                  <button
                    onClick={() => savePaid(true)}
                    disabled={savingPaid}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40"
                  >
                    ക്ലിയർ
                  </button>
                </div>
              ) : (
              <>
              <div className="print-hide grid sm:grid-cols-4 gap-2">
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="തുക (₹)"
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15"
                />
                <DateField
                  name="paidAt"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                />
                <SelectField
                  name="paidMethod"
                  value={paidMethod}
                  onChange={(e) => setPaidMethod(e.target.value)}
                >
                  <option value="">രീതി തിരഞ്ഞെടുക്കുക</option>
                  {Object.entries(PAID_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </SelectField>
                <input
                  value={paidNote}
                  onChange={(e) => setPaidNote(e.target.value)}
                  placeholder="ചെക്ക് നമ്പർ / റഫറൻസ്"
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-green-600 focus:ring-[3px] focus:ring-green-600/15"
                />
              </div>
              <div className="print-hide flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => savePaid()}
                  disabled={savingPaid || paidAmount === ''}
                  className="px-4 py-2 bg-[#1F6B3A] text-white rounded-xl text-sm font-semibold hover:bg-[#175530] disabled:opacity-40"
                >
                  {savingPaid ? 'സേവ് ചെയ്യുന്നു…' : 'സേവ് ചെയ്യുക'}
                </button>
                {submission.paidAmount != null && (
                  <button
                    onClick={() => { fillPaid(submission); setEditingPaid(false); }}
                    disabled={savingPaid}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40"
                  >
                    റദ്ദാക്കുക
                  </button>
                )}
              </div>
              </>
              )}
            </div>
          )}

          {submission.status === 'rejected' && submission.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <b>നിരസിച്ചതിന്റെ കാരണം:</b> {submission.rejectionReason}
            </div>
          )}
        </div>

        {/* Area president's verification */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-4">
          <h2 className="font-bold text-gray-800 mb-2">ജമാഅത്തെ ഇസ്ലാമി ഏരിയാ പ്രസിഡന്റിന്റെ ശുപാർശ</h2>
          {submission.areaVerification?.comment ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.areaVerification.comment}</p>
              <p className="text-xs text-gray-500 mt-2">
                — {submission.areaVerification.verifiedByName},{' '}
                {new Date(submission.areaVerification.verifiedAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">ഏരിയ അഡ്മിൻ ഇതുവരെ വെരിഫൈ ചെയ്തിട്ടില്ല.</p>
          )}
        </div>

        {/* Office use — admins/super admin only; saved text prints, the editor does not */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-4">
          <h2 className="font-bold text-gray-800 mb-2">ഓഫീസ് ഉപയോഗത്തിന്</h2>
          {submission.officeComment?.comment ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.officeComment.comment}</p>
              <p className="text-xs text-gray-500 mt-2">
                — {submission.officeComment.byName} ({submission.officeComment.byRole}),{' '}
                {new Date(submission.officeComment.at).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-3 pdf-hide">ഓഫീസ് കുറിപ്പ് ഇതുവരെ ചേർത്തിട്ടില്ല.</p>
          )}
          {submission.officeComment?.comment && !editingOffice ? (
            /* Saved — one-time note; editor opens only on demand */
            <button
              onClick={() => { setOfficeComment(submission.officeComment.comment); setEditingOffice(true); }}
              className="pdf-hide px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50"
            >
              കുറിപ്പ് എഡിറ്റ് ചെയ്യുക
            </button>
          ) : (
            <div className="pdf-hide">
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder="ഓഫീസ് കുറിപ്പ് (ഓപ്ഷണൽ) — ഉദാ: യോഗ തീരുമാനം"
                value={officeComment}
                onChange={(e) => setOfficeComment(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={saveOfficeComment} disabled={!officeComment.trim()}
                  className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 disabled:opacity-50">
                  {editingOffice ? 'കുറിപ്പ് പുതുക്കുക' : 'കുറിപ്പ് സേവ് ചെയ്യുക'}
                </button>
                {editingOffice && (
                  <button onClick={() => setEditingOffice(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">
                    റദ്ദാക്കുക
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        </div>{/* end printable contentRef */}

        {/* Status actions */}
        <div className="print-hide bg-white rounded-xl shadow p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-bold text-gray-800">സ്റ്റാറ്റസ് മാറ്റുക</h2>
            <span className="text-xs text-gray-500">
              ഇപ്പോഴത്തെ സ്റ്റാറ്റസ്:{' '}
              <b className={submission.status === 'approved' ? 'text-emerald-700' : submission.status === 'rejected' ? 'text-red-600' : 'text-gray-700'}>
                {STATUS_LABELS[submission.status] || submission.status}
              </b>
            </span>
          </div>
          {message && <p className="text-sm text-emerald-700 mb-2">{message}</p>}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
            {submission.status !== 'under_review' && (
              <button onClick={() => changeStatus('under_review')}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors">
                Under review — പരിശോധനയിൽ
              </button>
            )}
            <button
              onClick={() => {
                // suggest requested − own contribution; admin can edit or clear it
                const suggested =
                  submission.requestedAmount != null
                    ? Math.max(0, submission.requestedAmount - (submission.ownContribution || 0))
                    : null;
                setApprovedAmount(suggested != null ? String(suggested) : '');
                setShowApprove(true);
              }}
              className={
                submission.status === 'approved'
                  ? 'w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors'
                  : 'w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-colors'
              }>
              {submission.status === 'approved'
                ? 'അനുവദിച്ച തുക മാറ്റുക'
                : '✓ Approve — അംഗീകരിക്കുക'}
            </button>
            {submission.status !== 'rejected' && (
              <button onClick={() => setShowReject(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                ✕ Reject — നിരസിക്കുക
              </button>
            )}
          </div>
          {showApprove && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                അനുവദിച്ച തുക (₹) — ഓപ്ഷണൽ, മാറ്റാവുന്നതാണ്
              </label>
              <p className="text-xs text-gray-500 mb-2">
                {submission.requestedAmount != null ? (
                  <>
                    പ്രതീക്ഷിക്കുന്ന ചെലവ്: ₹ {submission.requestedAmount.toLocaleString('en-IN')}
                    {submission.ownContribution != null && (
                      <>
                        {' '}− സ്വന്തമായി ശേഖരിക്കാവുന്നത്: ₹ {submission.ownContribution.toLocaleString('en-IN')}
                        {' '}= ₹ {Math.max(0, submission.requestedAmount - submission.ownContribution).toLocaleString('en-IN')}
                      </>
                    )}
                  </>
                ) : (
                  'ഈ അപേക്ഷയിൽ തുക ചോദിച്ചിട്ടില്ല — ഒഴിവാക്കാം.'
                )}
              </p>
              <input
                type="number"
                min="0"
                className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="ഉദാ: 25000"
                value={approvedAmount}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => setApprovedAmount(e.target.value)}
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => changeStatus('approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                >
                  Confirm approve
                </button>
                <button
                  onClick={() => setShowApprove(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showReject && (
            <div className="mt-3">
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
                placeholder="നിരസിക്കാനുള്ള കാരണം (നിർബന്ധം)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <button
                onClick={() => changeStatus('rejected')}
                disabled={!rejectionReason.trim()}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                Confirm reject
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubmissionDetails;
