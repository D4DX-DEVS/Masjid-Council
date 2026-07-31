import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { SkeletonBar, DetailSkeleton } from '../components/Skeleton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_STYLES = {
  pending: { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
  approved: { text: 'Approved', class: 'bg-green-100 text-green-800' },
  rejected: { text: 'Rejected', class: 'bg-red-100 text-red-800' }
};

const Field = ({ label, value }) => (
  <div>
    <label className="text-sm font-medium text-gray-500">{label}</label>
    <p className="text-base text-gray-900 break-words">{value || 'N/A'}</p>
  </div>
);

// ponytail: shared by admin (read-only) and super admin (approve/reject)
const KhateebRegistrationDetails = ({ role = 'admin' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [message, setMessage] = useState('');

  const canDecide = role === 'superadmin';

  useEffect(() => {
    const id = location.state?.registration?._id;
    if (!id) {
      setError('No khateeb registration data found');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/khateebRegistration/${id}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || 'Failed to fetch khateeb registration details');
        }
      } catch (err) {
        console.error('Fetch khateeb registration details error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [location.state]);

  const updateStatus = async (status, reason) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/khateebRegistration/${data._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status, rejectionReason: reason || '' })
      });

      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setMessage(`Registration ${status} successfully!`);
      } else {
        setMessage('Failed to update status: ' + result.message);
      }
    } catch (err) {
      console.error('Update khateeb registration status error:', err);
      setMessage('Network error. Please try again.');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
      setRejectionReason('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <SkeletonBar className="h-24 w-full rounded-none" />
          <div className="p-4 sm:p-6">
            <DetailSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">{error || 'ഡാറ്റ ലഭ്യമല്ല'}</h2>
          <button onClick={() => navigate(-1)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_STYLES[data.status] || { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6" style={{ fontFamily: 'Anek Malayalam Variable' }}>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5e9e44] to-[#9ece88] text-white p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-green-700 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold">MIRQATH '26 — ഖത്തീബ് സംഗമം രജിസ്ട്രേഷൻ</h1>
              <p className="text-green-100 text-xs sm:text-sm">മസ്ജിദ് കൗൺസിൽ കേരള</p>
              <p className="text-green-200 text-xs">രജിസ്ട്രേഷൻ ഐഡി: {data._id?.slice(-8) || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {message && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">{message}</div>
          )}

          {/* Summary */}
          <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">രജിസ്ട്രേഷൻ സംഗ്രഹം</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="സമർപ്പണ തീയതി" value={data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-GB') : 'N/A'} />
              <div>
                <label className="text-sm font-medium text-gray-500">സ്റ്റാറ്റസ്</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.class}`}>{statusConfig.text}</span>
                </div>
              </div>
              <Field label="രജിസ്ട്രേഷൻ ഫീസ് (₹250)" value={data.feePaid === 'yes' ? 'അടച്ചു' : 'അടച്ചിട്ടില്ല'} />
            </div>
          </div>

          {/* Personal */}
          <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">1. വ്യക്തിഗത വിവരങ്ങൾ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ഖത്തീബിന്റെ പേര്" value={data.fullName} />
              <Field label="ഫോൺ / വാട്ട്സ്ആപ്പ്" value={data.phone} />
              <Field label="ഇമെയിൽ" value={data.email} />
            </div>
          </div>

          {/* Masjid */}
          <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">2. മഹല്ല് / മസ്ജിദ് വിവരങ്ങൾ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="മസ്ജിദിന്റെ പേര്" value={data.masjidName} />
              <Field label="സ്ഥലം / മഹല്ല്" value={data.mahallu} />
              <Field label="ഏരിയ" value={data.area} />
              <Field label="ജില്ല" value={data.district} />
            </div>
          </div>

          {/* Participation */}
          <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">3. സംഗമത്തിലെ പങ്കാളിത്തം</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="പങ്കെടുക്കുന്നു" value={data.attending === 'yes' ? 'അതെ, പങ്കെടുക്കും' : 'ഇല്ല'} />
              {data.attending === 'no' && <Field label="കാരണം" value={data.notAttendingReason} />}
            </div>
          </div>

          {data.rejectionReason && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">നിരസിച്ചതിന്റെ കാരണം</h2>
              <p className="text-gray-800">{data.rejectionReason}</p>
            </div>
          )}

          {/* Super admin actions */}
          {canDecide && data.status === 'pending' && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => updateStatus('approved')}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" /> അംഗീകരിക്കുക
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" /> നിരസിക്കുക
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-3">നിരസിക്കുക</h3>
            <textarea
              rows="4"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="കാരണം എഴുതുക"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">
                റദ്ദാക്കുക
              </button>
              <button
                onClick={() => rejectionReason.trim() && updateStatus('rejected', rejectionReason.trim())}
                disabled={!rejectionReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
              >
                നിരസിക്കുക
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KhateebRegistrationDetails;
