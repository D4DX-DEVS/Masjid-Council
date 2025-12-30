import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader2, Settings } from 'lucide-react';
import SuperAdminNavbar from '../components/SuperAdminNavbar';
import StatusChangeModal from '../components/StatusChangeModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SuperAdminMosqueFundDetails = () => {
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

  useEffect(() => {
    // Get the mosque fund ID from location state
    const mosqueFundId = location.state?.mosqueFund?._id;
    
    if (mosqueFundId) {
      fetchMosqueFundDetails(mosqueFundId);
    } else {
      setError('No mosque fund data found');
      setLoading(false);
    }
  }, [location.state]);

  const fetchMosqueFundDetails = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/mosqueFund/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setFormData(data.data);
      } else {
        setError(data.message || 'Failed to fetch mosque fund details');
      }
    } catch (error) {
      console.error('Fetch mosque fund details error:', error);
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

  // Status Change Functions
  const handleStatusChangeClick = () => {
    setShowStatusChangeModal(true);
  };

  const handleStatusChange = async (newStatus, rejectionReason) => {
    setStatusChangeLoading(true);
    try {
      const token = localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken');
      if (!token) {
        showAlert('No super admin token found. Please login again.', 'error');
        setShowStatusChangeModal(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/superadmin/mosque-fund/${formData._id}/status`, {
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
        showAlert(`Mosque fund status changed to ${newStatus} successfully!`, 'success');
        setShowStatusChangeModal(false);
        // Update the local state
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

  const handleConfirmClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken');
      if (!token) {
        showAlert('No super admin token found. Please login again.', 'error');
        setShowConfirmModal(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/mosqueFund/${formData._id}`, {
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
        showAlert('Mosque fund application approved successfully!', 'success');
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
      const token = localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken');
      if (!token) {
        showAlert('No super admin token found. Please login again.', 'error');
        setShowRejectModal(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/mosqueFund/${formData._id}`, {
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
        showAlert('Mosque fund application rejected successfully!', 'success');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mosque fund details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4" style={{ fontFamily: "Anek Malayalam Variable" }}>
            Error: {error}
          </h2>
          <button 
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
          <h2 className="text-xl font-semibold text-gray-600" style={{ fontFamily: "Anek Malayalam Variable" }}>
            ഡാറ്റ ലഭ്യമല്ല
          </h2>
          <button 
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-4"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Use actual formData instead of dummy data
  const displayData = formData || {};

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleApprove = () => {
    handleConfirmClick();
  };

  const getFileType = (url) => {
    if (!url) return 'unknown';
    const extension = url.split('.').pop().toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) return 'image';
    return 'unknown';
  };

  const getFileTypeDisplay = (url) => {
    const type = getFileType(url);
    return type === 'pdf' ? 'PDF രേഖ' : 'ചിത്ര രേഖ';
  };

  const getViewButtonText = (url) => {
    const type = getFileType(url);
    return type === 'pdf' ? 'രേഖ കാണുക' : 'ചിത്രം കാണുക';
  };


  const getStatusBadge = (status) => {
    const styles = {
      'പരിഗണനയിൽ': 'bg-yellow-100 text-yellow-800',
      'അനുമതി': 'bg-green-100 text-green-800',
      'നിരസിച്ചു': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "Anek Malayalam Variable" }}>
      <SuperAdminNavbar />
      <div className="p-4">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5e9e44] to-[#9ece88] text-white p-4 rounded-t-lg">
          <div className="flex items-center gap-3">
              <button 
              onClick={handleBack}
              className="p-2 hover:bg-green-700 rounded-full transition-colors"
              >
              <ArrowLeft className="w-5 h-5" />
              </button>
                <div>
              <h1 className="text-xl font-bold">മസ്ജിദ് ഫണ്ട് സഹായ അപേക്ഷ</h1>
                <p className="text-green-100 text-sm">മസ്ജിദ് ഫണ്ട് അപേക്ഷ വിവരങ്ങൾ</p>
                <p className="text-green-200 text-xs">അപേക്ഷ ഐഡി: {formData._id?.slice(-8) || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Application Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">അപേക്ഷ സംഗ്രഹം</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">അപേക്ഷ ഐഡി</label>
                <p className="text-lg font-bold text-purple-600">{displayData.applicationId || displayData._id?.slice(-8) || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">സമർപ്പണ തീയതി</label>
                <p className="text-lg font-medium text-gray-900">{displayData.submissionDate || (displayData.createdAt ? new Date(displayData.createdAt).toLocaleDateString() : 'N/A')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">പ്രവേശനം</label>
                <div className="mt-1">{getStatusBadge(displayData.status || 'pending')}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">അഭ്യർത്ഥിച്ച തുക</label>
                <p className="text-lg font-bold text-red-600">₹{displayData.expectedExpense || '0'}</p>
              </div>
            </div>
          </div>

          {/* Mosque Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">മസ്ജിദ് വിവരങ്ങൾ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">മസ്ജിദിന്റെ പേര്</label>
                <p className="text-lg font-medium text-gray-900">{displayData.mosqueName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">എംസികെ അഫിലിയേഷൻ നമ്പർ</label>
                <p className="text-lg font-medium text-gray-900">{displayData.mckAffiliation || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">മാനേജിംഗ് കമ്മിറ്റി/ട്രസ്‌റ്റ്</label>
                <p className="text-gray-900">{displayData.managementType || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">പ്രസിഡന്റ്/ചെയർമാൻ</label>
                <p className="text-gray-900">{displayData.presidentSecretary || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ഫോൺ</label>
                <p className="text-gray-900">{displayData.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ജമാത്ത് ഇസ്ലാമി പ്രാദേശിക ഘടകം</label>
                <p className="text-gray-900">{displayData.jamathIslami || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ഏരിയ</label>
                <p className="text-gray-900">{displayData.area || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ജില്ല</label>
                <p className="text-gray-900">{displayData.district || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">മസ്ജിദ് പ്രസിഡന്റ്/സെക്രട്ടറി</label>
                <p className="text-gray-900">{displayData.mosqueOfficialName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ഫോൺ</label>
                <p className="text-gray-900">{displayData.mosqueOfficialPhone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">വാട്സാപ്പ് നമ്പർ</label>
                <p className="text-gray-900">{displayData.whatsappNumber || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500">വിലാസം</label>
              <p className="text-gray-900 whitespace-pre-wrap">{displayData.address || 'N/A'}</p>
            </div>
          </div>

          {/* Fund Collection History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">മുൻ സഹായ വിവരങ്ങൾ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">മാസിക ഫണ്ട് ശേഖരണം</label>
                <p className="text-lg font-medium text-green-600">{displayData.mckFundService || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">മുൻ സഹായം ലഭിച്ചത്</label>
                <p className="text-lg font-medium text-gray-900">{displayData.previousHelp || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Current Help Request */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">നിലവിലെ സഹായ അഭ്യർത്ഥന</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">സഹായം ആവശ്യമുള്ളത്</label>
                <p className="text-lg font-medium text-purple-600">{displayData.helpPurpose || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">വിശദ വിവരണം</label>
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{displayData.needDescription || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">പ്രതീക്ഷിക്കുന്ന ചെലവ്</label>
                  <p className="text-xl font-bold text-red-600">₹{displayData.expectedExpense || '0'}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">സ്വന്തം സംഭാവന</label>
                  <p className="text-xl font-bold text-green-600">₹{displayData.ownContribution || '0'}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">ആവശ്യപ്പെടുന്ന തുക</label>
                  <p className="text-xl font-bold text-blue-600">₹{(parseInt(displayData.expectedExpense || 0) - parseInt(displayData.ownContribution || 0)).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ആവശ്യമായ രേഖകൾ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Passbook Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">ബാങ്ക് പാസ്ബുക്ക്</h3>
                  <div className="flex items-center text-blue-600">
                    {getFileType(displayData.bankPassbook) === 'pdf' ? (
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" clipRule="evenodd" />
                      </svg>
                    )}
                    {getFileTypeDisplay(displayData.bankPassbook)}
                  </div>
                </div>
                
                {displayData.bankPassbook && displayData.bankPassbook.startsWith('http') ? (
                  <div className="flex gap-2">
                      <a 
                        href={displayData.bankPassbook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {getViewButtonText(displayData.bankPassbook)}
                      </a>
                      <button 
                        onClick={() => handleDownload(displayData.bankPassbook, `bank-passbook-${displayData._id?.slice(-8) || 'document'}.pdf`)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ഡൗൺലോഡ്
                      </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">ബാങ്ക് പാസ്ബുക്ക് അപ്ലോഡ് ചെയ്തിട്ടില്ല</p>
                  </div>
                )}
              </div>

              {/* Plan & Estimate Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-900">പദ്ധതി & കണക്ക്</h3>
                  <div className="flex items-center text-green-600">
                    {getFileType(displayData.fullEstimate) === 'pdf' ? (
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" clipRule="evenodd" />
                      </svg>
                    )}
                    {getFileTypeDisplay(displayData.fullEstimate)}
                  </div>
                </div>
                
                {displayData.fullEstimate && displayData.fullEstimate.startsWith('http') ? (
                  <div className="flex gap-2">
                      <a 
                        href={displayData.fullEstimate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {getViewButtonText(displayData.fullEstimate)}
                      </a>
                      <button 
                        onClick={() => handleDownload(displayData.fullEstimate, `plan-estimate-${displayData._id?.slice(-8) || 'document'}.pdf`)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ഡൗൺലോഡ്
                      </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">പദ്ധതി & കണക്ക് അപ്ലോഡ് ചെയ്തിട്ടില്ല</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Super Admin Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">അപേക്ഷ പ്രവേശനം</h2>
            
            {/* Show buttons only if status is pending */}
            {displayData.status === 'pending' ? (
              <div className="flex gap-3">
              <button 
                onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  അനുമതി
                </button>
                <button 
                  onClick={handleRejectClick}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  നിരസിക്കുക
                </button>
              </div>
            ) : (
              /* Show simple status if already processed */
              <div className="text-center py-4">
                {displayData.status === 'approved' ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Application Approved</span>
                  </div>
                ) : displayData.status === 'rejected' ? (
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Application Rejected</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-yellow-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Application Pending</span>
                  </div>
                )}
                {/* Status Change Button */}
                <div className="mt-4">
                  <button
                    onClick={handleStatusChangeClick}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Change Status
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Approval</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to approve this mosque fund application? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </div>
                ) : (
                  'Approve Application'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <XCircle className="w-8 h-8 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Rejection</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject this mosque fund application? This action cannot be undone.
            </p>
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
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </div>
                ) : (
                  'Reject Application'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              {alertType === 'success' && <CheckCircle className="w-8 h-8 text-green-600 mr-3" />}
              {alertType === 'error' && <XCircle className="w-8 h-8 text-red-600 mr-3" />}
              {alertType === 'warning' && <AlertCircle className="w-8 h-8 text-yellow-600 mr-3" />}
              <h3 className="text-lg font-semibold text-gray-900">
                {alertType === 'success' && 'Success'}
                {alertType === 'error' && 'Error'}
                {alertType === 'warning' && 'Warning'}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">{alertMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={closeAlert}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={showStatusChangeModal}
        onClose={() => setShowStatusChangeModal(false)}
        currentStatus={formData?.status}
        onStatusChange={handleStatusChange}
        loading={statusChangeLoading}
        formType="Mosque Fund"
      />
    </div>
  );
};

export default SuperAdminMosqueFundDetails;

