import React, { useState, useEffect } from 'react';
import { authHeaders } from '../lib/auth';
import { invalidate } from '../lib/apiCache';
import { usePdfExport } from '../hooks/usePdfExport';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader2, Settings, Download } from 'lucide-react';
import { getPurposeLabel, getRequiredDocuments, isViewableUrl } from '../lib/welfareFundDocs';
import StatusChangeModal from '../components/StatusChangeModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MedicalAidDataList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success'); // 'success', 'error', 'warning'
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const isImageUrl = (url) => /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url || '');
  const { contentRef, downloading, handleDownload: handlePdfDownload } = usePdfExport('welfare-fund');

  useEffect(() => {
    // Get the medical aid ID from location state
    const medicalAidId = location.state?.medicalAid?._id;
    
    if (medicalAidId) {
      fetchMedicalAidDetails(medicalAidId);
    } else {
      setError('No medical aid data found');
      setLoading(false);
    }
  }, [location.state]);

  const fetchMedicalAidDetails = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/welfarefund/${id}`, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      });

      const data = await response.json();
      
      if (data.success) {
        setFormData(data.data);
      } else {
        setError(data.message || 'Failed to fetch medical aid details');
      }
    } catch (error) {
      console.error('Fetch medical aid details error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const showAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const closeAlert = () => {
    setShowAlertModal(false);
    setAlertMessage('');
  };

  const handleConfirmClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showAlert('No admin token found. Please login again.', 'error');
        setShowConfirmModal(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/welfarefund/${formData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'approved'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showAlert('Medical aid application approved successfully!', 'success');
        setShowConfirmModal(false);
        // Update the local state
        setFormData({ ...formData, status: 'approved' });
      } else {
        showAlert('Failed to approve application: ' + data.message, 'error');
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error('Approve application error:', error);
      showAlert('Network error. Please try again.', 'error');
      setShowConfirmModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showAlert('Please provide a reason for rejection.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showAlert('No admin token found. Please login again.', 'error');
        setShowRejectModal(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/welfarefund/${formData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: rejectionReason.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showAlert('Medical aid application rejected successfully!', 'success');
        setShowRejectModal(false);
        setRejectionReason('');
        // Update the local state
        setFormData({ ...formData, status: 'rejected', rejectionReason: rejectionReason.trim() });
      } else {
        showAlert('Failed to reject application: ' + data.message, 'error');
        setShowRejectModal(false);
      }
    } catch (error) {
      console.error('Reject application error:', error);
      showAlert('Network error. Please try again.', 'error');
      setShowRejectModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChangeClick = () => {
    setShowStatusChangeModal(true);
  };

  const handleStatusChange = async (newStatus, rejectionReason) => {
    setStatusChangeLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showAlert('No admin token found. Please login again.', 'error');
        setShowStatusChangeModal(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/superadmin/welfare-fund/${formData._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: rejectionReason || null
        })
      });

      const data = await response.json();

      if (data.success) {
        invalidate(); // list caches now hold a stale status
        showAlert(`Medical aid status changed to ${newStatus} successfully!`, 'success');
        setShowStatusChangeModal(false);
        setFormData({
          ...formData,
          status: newStatus,
          rejectionReason: rejectionReason || null,
          updatedAt: new Date()
        });
      } else {
        showAlert('Failed to change status: ' + data.message, 'error');
        setShowStatusChangeModal(false);
      }
    } catch (error) {
      console.error('Status change error:', error);
      showAlert('Network error. Please try again.', 'error');
      setShowStatusChangeModal(false);
    } finally {
      setStatusChangeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical aid details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4" style={{ fontFamily: 'var(--font-ml-title)' }}>
            Error: {error}
          </h2>
          <button 
            onClick={handleBack}
            className="inline-flex items-center h-10 px-5 bg-[#1F6B3A] text-white text-sm font-semibold rounded-xl hover:bg-[#2E7D4F] shadow-sm transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600" style={{ fontFamily: 'var(--font-ml-title)' }}>
            ഡാറ്റ ലഭ്യമല്ല
          </h2>
          <button
            onClick={handleBack}
            className="inline-flex items-center h-10 px-5 mt-4 bg-[#1F6B3A] text-white text-sm font-semibold rounded-xl hover:bg-[#2E7D4F] shadow-sm transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleDownloadPdfClick = () => handlePdfDownload(
    formData._id?.slice(-8),
    () => showAlert('PDF ഡൗൺലോഡ് പരാജയപ്പെട്ടു. വീണ്ടും ശ്രമിക്കുക.', 'error')
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ fontFamily: "Noto Sans Malayalam" }}>
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5e9e44] to-[#9ece88] text-white p-3 sm:p-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-green-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-bold leading-snug">ഇമാം മുഅദ്ദിൻ ക്ഷേമനിദി അപേക്ഷ</h1>
              <p className="text-green-100 text-xs sm:text-sm">Medical Aid Application Details</p>
              <p className="text-green-200 text-xs">Application ID: {formData._id?.slice(-8) || 'N/A'}</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <button
                onClick={handleDownloadPdfClick}
                disabled={downloading}
                aria-label="Download as PDF"
                title="Download as PDF"
                className="p-2 hover:bg-green-700 rounded-full transition-colors disabled:opacity-50"
              >
                {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3 mt-2" ref={contentRef}>
          {/* Application Summary */}
          <section className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-sm sm:text-base font-semibold mb-2 text-gray-800 border-b pb-2">അപേക്ഷാ സംഗ്രഹം</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">അപേക്ഷാ നമ്പർ</label>
                <p className="text-lg font-bold text-blue-600">{formData._id?.slice(-8) || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">സമർപ്പിച്ച തീയതി</label>
                <p className="text-sm font-medium text-gray-900 break-words">
                  {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString('ml-IN') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">അപേക്ഷയുടെ നിലവിലെ അവസ്ഥ</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    formData.status === 'approved' ? 'bg-[#EAF6EF] text-[#1F6B3A]' :
                    formData.status === 'rejected' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {formData.status === 'approved' ? 'അനുമതി' :
                     formData.status === 'rejected' ? 'നിരസിച്ചു' :
                     'പരിഗണനയിൽ'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">ആവശ്യപ്പെടുന്ന തുക</label>
                <p className="text-lg font-bold text-red-600">₹{formData.expectedExpense || '0'}</p>
              </div>
            </div>
          </section>

          {/* Mosque Information */}
          <section className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm sm:text-base font-semibold mb-2 text-gray-800 border-b pb-2">മസ്ജിദ് വിവരങ്ങൾ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">മസ്ജിദിന്റെ പേര്</label>
                <p className="text-sm font-medium text-gray-900 break-words">{formData.mosqueName || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">MCK അഫിലിയേഷൻ നമ്പർ</label>
                <p className="text-sm font-medium text-gray-900 break-words">{formData.mckAffiliation || 'വിവരം ഇല്ല'}</p>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-medium text-gray-500">വിലാസം</label>
              <p className="text-gray-900 whitespace-pre-wrap">{formData.address || 'വിവരം ഇല്ല'}</p>
            </div>
          </section>

          {/* Management Details */}
          <section className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm sm:text-base font-semibold mb-2 text-gray-800 border-b pb-2">മാനേജ്മെന്റ് വിവരങ്ങൾ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">പരിപാലന കമ്മിറ്റി പ്രസിഡന്റ്</label>
                <p className="text-sm text-gray-900 break-words">{formData.committeePerson || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">മാനേജ്മെന്റ് തരം</label>
                <p className="text-sm text-gray-900 break-words">{formData.managementType || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">ഫോൺ</label>
                <p className="text-sm text-gray-900 break-words">{formData.phone || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">വാട്സ്ആപ്പ്</label>
                <p className="text-sm text-gray-900 break-words">{formData.whatsapp || 'വിവരം ഇല്ല'}</p>
              </div>
            </div>
          </section>

          {/* Jamaat Details */}
          <section className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm sm:text-base font-semibold mb-2 text-gray-800 border-b pb-2">ജമാഅത്തെ ഇസ്‌ലാമി വിവരങ്ങൾ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">ഏരിയ</label>
                <p className="text-sm text-gray-900 break-words">{formData.area || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">ജില്ല</label>
                <p className="text-sm text-gray-900 break-words">{formData.district || 'വിവരം ഇല്ല'}</p>
              </div>
            </div>
          </section>

          {/* Applicant Details */}
          <section className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm sm:text-base font-semibold mb-2 text-gray-800 border-b pb-2">അപേക്ഷ വിവരങ്ങൾ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">അപേക്ഷ സമർപ്പിക്കുന്നത് ആർക്കാണ് വേണ്ടി</label>
                  <p className="text-sm font-medium text-gray-900 break-words">{formData.applicantDetails || 'വിവരം ഇല്ല'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">ജോലി ചെയ്യുന്ന തസ്‌തിക</label>
                  <p className="text-sm text-gray-900 break-words">{formData.chairmanDesignation || 'വിവരം ഇല്ല'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">വേതനം</label>
                  <p className="text-lg font-medium text-green-600">₹{formData.salary || '0'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Help Request Details */}
          <section className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm sm:text-base font-semibold mb-2 text-gray-800 border-b pb-2">സഹായാഭ്യർത്ഥന വിവരങ്ങൾ</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500">സഹായത്തിന്റെ ഉദ്ദേശ്യം</label>
                <p className="text-lg font-medium text-blue-600">{getPurposeLabel(formData.helpPurpose) || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">ആവശ്യത്തിന്റെ വിശദവിവരം</label>
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{formData.needDescription || 'വിവരം ഇല്ല'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <label className="text-xs font-medium text-gray-500">പ്രതീക്ഷിക്കുന്ന ചെലവ്</label>
                  <p className="text-xl font-bold text-red-600">₹{formData.expectedExpense || '0'}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <label className="text-xs font-medium text-gray-500">സ്വന്തം സംഭാവന</label>
                  <p className="text-xl font-bold text-green-600">₹{formData.ownContribution || '0'}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <label className="text-xs font-medium text-gray-500">ആവശ്യപ്പെടുന്ന തുക</label>
                  <p className="text-xl font-bold text-blue-600">₹{(parseInt(formData.expectedExpense || 0) - parseInt(formData.ownContribution || 0)).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Previous Help */}
          <section className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm sm:text-base font-semibold mb-2 text-gray-800 border-b pb-2">മുമ്പത്തെ സഹായം</h2>
            <div>
              <label className="text-xs font-medium text-gray-500">MCK യിൽ നിന്ന് മുമ്പ് സഹായം ലഭിച്ചിട്ടുണ്ടോ?</label>
              <p className="text-sm font-medium text-gray-900 break-words">{formData.previousHelp || 'വിവരം ഇല്ല'}</p>
            </div>
          </section>

          {/* Mosque Officials */}
          <section className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm sm:text-base font-semibold mb-2 text-gray-800 border-b pb-2">മസ്‌ജിദ് ഉദ്യോഗസ്ഥ വിവരങ്ങൾ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium mb-3 text-blue-800">പ്രസിഡന്‍റ് / സെക്രട്ടറി</h3>
                <div className="space-y-2">
                  <p><span className="text-sm text-gray-600">പേര്:</span> {formData.mosquePresident || 'വിവരം ഇല്ല'}</p>
                  <p><span className="text-sm text-gray-600">ഫോൺ:</span> {formData.mosquePhone || 'വിവരം ഇല്ല'}</p>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium mb-3 text-green-800">അടിയന്തിര ബന്ധം</h3>
                <div className="space-y-2">
                  <p><span className="text-sm text-gray-600">പേര്:</span> {formData.emergencyContact || 'വിവരം ഇല്ല'}</p>
                  <p><span className="text-sm text-gray-600">ഫോൺ:</span> {formData.emergencyPhone || 'വിവരം ഇല്ല'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Required Documents Checklist */}
          <section className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm sm:text-base font-semibold mb-2 text-gray-800 border-b pb-2">ആവശ്യമായ രേഖകൾ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getRequiredDocuments(formData.helpPurpose).map((doc) => {
                const stored = formData.documents?.[doc.key];
                const url = isViewableUrl(stored) ? stored : null;
                return (
                  <div key={doc.key} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${url ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        {url ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M4 9h12v2H4V9z" clipRule="evenodd" />
                        )}
                      </svg>
                    </div>
                    <span className="text-sm text-gray-900 break-words">{doc.ml}</span>
                    {url ? (
                      <span className="flex items-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (isImageUrl(url)) {
                              e.preventDefault();
                              setPreviewImage(url);
                            }
                          }}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          കാണുക
                        </a>
                        <a
                          href={url}
                          download
                          className="text-xs font-medium text-green-600 hover:underline"
                        >
                          ഡൗൺലോഡ്
                        </a>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {doc.required ? 'നൽകിയിട്ടില്ല' : 'നിർബന്ധമില്ല'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Action Buttons - Only show for pending status */}
          {formData.status === 'pending' && (
            <div className="flex justify-between mt-8 pdf-hide">
              <button
                onClick={handleConfirmClick}
                className="inline-flex items-center gap-2 h-10 px-6 bg-[#1F6B3A] hover:bg-[#2E7D4F] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
                Approve
  </button>
              <button
                onClick={handleRejectClick}
                className="inline-flex items-center gap-2 h-10 px-6 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
    Reject
  </button>
</div>
          )}

          {/* Status Display for non-pending forms */}
          {formData.status !== 'pending' && (
            <div className="mt-8 p-6 bg-[#F7F9FB] border border-[#E5E7EB] rounded-2xl">
              <div className="text-center">
                <h3 className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Application Status</h3>
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${
                  formData.status === 'approved'
                    ? 'bg-[#EAF6EF] text-[#1F6B3A]'
                    : formData.status === 'rejected'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {formData.status === 'approved' ? <CheckCircle className="w-4 h-4" /> :
                   formData.status === 'rejected' ? <XCircle className="w-4 h-4" /> :
                   <AlertCircle className="w-4 h-4" />}
                  {formData.status === 'approved' ? 'Approved' :
                   formData.status === 'rejected' ? 'Rejected' :
                   'Unknown Status'}
                </span>
                <div className="mt-4 pdf-hide">
                  <button
                    onClick={handleStatusChangeClick}
                    className="inline-flex items-center gap-2 h-10 px-5 bg-[#1F6B3A] hover:bg-[#2E7D4F] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Change Status
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Modals */}
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 max-w-md w-full mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 break-words">Confirm Approval</h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to approve this medical aid application? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="h-10 px-5 text-sm font-semibold text-[#374151] bg-white border border-[#E5E7EB] hover:bg-gray-50 rounded-xl transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-[#1F6B3A] hover:bg-[#2E7D4F] rounded-xl shadow-sm transition-colors"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  'Approve'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 max-w-md w-full mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 break-words">Confirm Rejection</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to reject this medical aid application? This action cannot be undone.
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="h-10 px-5 text-sm font-semibold text-[#374151] bg-white border border-[#E5E7EB] hover:bg-gray-50 rounded-xl transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 max-w-md w-full mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                {alertType === 'success' && <CheckCircle className="h-8 w-8 text-green-600" />}
                {alertType === 'error' && <XCircle className="h-8 w-8 text-red-600" />}
                {alertType === 'warning' && <AlertCircle className="h-8 w-8 text-yellow-600" />}
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 break-words">
                  {alertType === 'success' && 'Success'}
                  {alertType === 'error' && 'Error'}
                  {alertType === 'warning' && 'Warning'}
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">{alertMessage}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={closeAlert}
                className={`inline-flex items-center justify-center h-10 px-5 text-sm font-semibold text-white rounded-xl transition-colors ${
                  alertType === 'success' ? 'bg-[#1F6B3A] hover:bg-[#2E7D4F]' :
                  alertType === 'error' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                OK
              </button>
        </div>
      </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
            aria-label="Close preview"
          >
            <XCircle className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Document preview"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={showStatusChangeModal}
        onClose={() => setShowStatusChangeModal(false)}
        currentStatus={formData?.status}
        onStatusChange={handleStatusChange}
        loading={statusChangeLoading}
        formType="Medical Aid"
      />
    </div>
  );
};

export default MedicalAidDataList;
