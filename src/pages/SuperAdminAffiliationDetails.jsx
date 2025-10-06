import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader2, Settings } from 'lucide-react';
import SuperAdminNavbar from '../components/SuperAdminNavbar';
import StatusChangeModal from '../components/StatusChangeModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SuperAdminAffiliationDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [affiliation, setAffiliation] = useState(null);
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
    // Get affiliation data from navigation state or fetch by ID
    const affiliationId = location.state?.affiliation?._id;
    
    if (affiliationId) {
      fetchAffiliationDetails(affiliationId);
    } else {
      setError('No affiliation data found');
      setLoading(false);
    }
  }, [location.state]);

  const fetchAffiliationDetails = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setAffiliation(data.data);
      } else {
        setError(data.message || 'Failed to fetch affiliation details');
      }
    } catch (error) {
      console.error('Fetch affiliation details error:', error);
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
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showAlert('No admin token found. Please login again.', 'error');
        setShowStatusChangeModal(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/superadmin/affiliation/${affiliation._id}/status`, {
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
        showAlert(`Affiliation status changed to ${newStatus} successfully!`, 'success');
        setShowStatusChangeModal(false);
        // Update the local state
        setAffiliation({ 
          ...affiliation, 
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
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showAlert('No admin token found. Please login again.', 'error');
        setShowConfirmModal(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/${affiliation._id}`, {
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
        showAlert('Affiliation application approved successfully!', 'success');
        setShowConfirmModal(false);
        // Update the local state
        setAffiliation({ ...affiliation, status: 'approved' });
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

      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/${affiliation._id}`, {
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
        showAlert('Affiliation application rejected successfully!', 'success');
        setShowRejectModal(false);
        setRejectionReason('');
        // Update the local state
        setAffiliation({ ...affiliation, status: 'rejected', rejectionReason: rejectionReason.trim() });
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
          <p className="mt-4 text-gray-600">Loading affiliation details...</p>
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

  if (!affiliation) {
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
              <h1 className="text-xl font-bold">മസ്ജിദ് അഫിലിയേഷൻ അപേക്ഷ</h1>
              <p className="text-green-100 text-sm">Mosque Affiliation Application Details</p>
              <p className="text-green-200 text-xs">Affiliation Number: {affiliation.affiliationNumber}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 mt-4">
          {/* Application Summary */}
          <section className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">അപേക്ഷാ സംഗ്രഹം</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">അഫിലിയേഷൻ നമ്പർ</label>
                <p className="text-lg font-bold text-blue-600">{affiliation.affiliationNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">സമർപ്പിച്ച തീയതി</label>
                <p className="text-lg font-medium text-gray-900">
                  {affiliation.createdAt ? new Date(affiliation.createdAt).toLocaleDateString('ml-IN') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">അപേക്ഷയുടെ നിലവിലെ അവസ്ഥ</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    affiliation.status === 'approved' ? 'bg-green-100 text-green-800' :
                    affiliation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {affiliation.status === 'approved' ? 'അനുമതി' :
                     affiliation.status === 'rejected' ? 'നിരസിച്ചു' :
                     'പരിഗണനയിൽ'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">പള്ളിയുടെ പേര്</label>
                <p className="text-lg font-bold text-blue-600">{affiliation.name || 'N/A'}</p>
              </div>
            </div>
          </section>

          {/* Basic Information */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">അടിസ്ഥാന വിവരങ്ങൾ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">പള്ളിയുടെ പേര്</label>
                <p className="text-lg font-medium text-gray-900">{affiliation.name || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">പള്ളിയുടെ സ്വഭാവം</label>
                <p className="text-lg font-medium text-gray-900">{affiliation.mosqueType || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">മഹല്ലിന്‍റെ സ്വഭാവം</label>
                <p className="text-lg font-medium text-gray-900">{affiliation.mahallaType || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">പ്രവർത്തനമാരംഭിച്ച വർഷം</label>
                <p className="text-lg font-medium text-gray-900">{affiliation.establishedYear || 'വിവരം ഇല്ല'}</p>
              </div>
            </div>
          </section>

          {/* Address Details */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">വിലാസ വിവരങ്ങൾ</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">പൂർണ വിലാസം</label>
                <p className="text-gray-900 whitespace-pre-wrap">{affiliation.address?.[0]?.address || 'വിവരം ഇല്ല'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ജില്ല</label>
                  <p className="text-gray-900">{affiliation.address?.[0]?.district || 'വിവരം ഇല്ല'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">പിൻകോഡ്</label>
                  <p className="text-gray-900">{affiliation.address?.[0]?.pincode || 'വിവരം ഇല്ല'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">ഫോൺ</label>
                  <p className="text-gray-900">{affiliation.address?.[0]?.phone || 'വിവരം ഇല്ല'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ഇ മെയിൽ</label>
                  <p className="text-gray-900">{affiliation.address?.[0]?.email || 'വിവരം ഇല്ല'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">വെബ്സൈറ്റ്</label>
                  <p className="text-gray-900">{affiliation.address?.[0]?.website || 'വിവരം ഇല്ല'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Jamaat-e-Islami Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Jamaat-e-Islami Unit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Area</label>
                <p className="text-gray-900">{affiliation.jamathArea?.[0]?.area || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">District</label>
                <p className="text-gray-900">{affiliation.jamathArea?.[0]?.district || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Mosque Facilities */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mosque Facilities</h2>
            {affiliation.facilities && affiliation.facilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {affiliation.facilities.map((facility, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-900">{facility}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No facilities selected</p>
            )}
          </div>

          {/* Cemetery Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cemetery Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Has Cemetery?</label>
                <p className="text-gray-900">{affiliation.hasCemetery ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Mosque Capacity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mosque Capacity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Prayer Capacity (People)</label>
                <p className="text-gray-900">{affiliation.mosqueCapacity || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Area</label>
                <p className="text-gray-900">{affiliation.mosqueArea || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Juma Participants */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Friday Participants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Male Participants</label>
                <p className="text-lg font-medium text-gray-900">{affiliation.fridayMaleAttendance || '0'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Female Participants</label>
                <p className="text-lg font-medium text-gray-900">{affiliation.fridayFemaleAttendance || '0'}</p>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Assets (Fixed & Movable)</label>
                <p className="text-gray-900 whitespace-pre-wrap">{affiliation.finance?.[0]?.assets || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Income Sources</label>
                <p className="text-gray-900 whitespace-pre-wrap">{affiliation.finance?.[0]?.incomeSource || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Monthly Expense (₹)</label>
                <p className="text-lg font-medium text-gray-900">₹{affiliation.finance?.[0]?.monthlyExpense || '0'}</p>
              </div>
            </div>
          </div>

          {/* Official Records */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Official Records</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Audit Conducted?</label>
                <p className="text-gray-900">{affiliation.audit?.[0]?.hasAudit ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Records Maintained</label>
                {affiliation.audit?.[0]?.recordsKept && affiliation.audit[0].recordsKept.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                    {affiliation.audit[0].recordsKept.map((record, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-900 text-sm">{record}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No records selected</p>
                )}
              </div>
            </div>
          </div>

          {/* Last Year Accounts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Year Accounts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Income (₹)</label>
                <p className="text-lg font-medium text-green-600">₹{affiliation.accounts?.[0]?.lastYearIncome || '0'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Expense (₹)</label>
                <p className="text-lg font-medium text-red-600">₹{affiliation.accounts?.[0]?.lastYearExpense || '0'}</p>
              </div>
            </div>
          </div>

          {/* Community Services */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Services</h2>
            <div className="space-y-4">
              {affiliation.commmunityServices && affiliation.commmunityServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {affiliation.commmunityServices.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-gray-900">{service}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No services selected</p>
              )}
              {affiliation.otherCommunityServices && affiliation.otherCommunityServices.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Others</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{affiliation.otherCommunityServices.join('\n')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Managing Committee */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Managing Committee</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Committee Name</label>
                <p className="text-gray-900">{affiliation.committees?.[0]?.committeeType || 'Not provided'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-3 text-blue-800">President / Chairman</h3>
                  <div className="space-y-2">
                    <p><span className="text-sm text-gray-500">Name:</span> {affiliation.committees?.[0]?.president?.[0]?.name || 'Not provided'}</p>
                    <p><span className="text-sm text-gray-500">Mobile:</span> {affiliation.committees?.[0]?.president?.[0]?.phone || 'Not provided'}</p>
                    <p><span className="text-sm text-gray-500">Email:</span> {affiliation.committees?.[0]?.president?.[0]?.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium mb-3 text-green-800">Secretary</h3>
                  <div className="space-y-2">
                    <p><span className="text-sm text-gray-500">Name:</span> {affiliation.committees?.[0]?.secretary?.[0]?.name || 'Not provided'}</p>
                    <p><span className="text-sm text-gray-500">Mobile:</span> {affiliation.committees?.[0]?.secretary?.[0]?.phone || 'Not provided'}</p>
                    <p><span className="text-sm text-gray-500">Email:</span> {affiliation.committees?.[0]?.secretary?.[0]?.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff Details</h2>
            {affiliation.committees?.[0]?.workers && affiliation.committees[0].workers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-500">No.</th>
                      <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-500">Age</th>
                      <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-500">Qualification</th>
                      <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-500">Salary</th>
                      <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-500">Working</th>
                      <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-500">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliation.committees[0].workers.map((staff, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-3">{index + 1}</td>
                        <td className="border border-gray-200 p-3">{staff.age || '-'}</td>
                        <td className="border border-gray-200 p-3">{staff.qualification || '-'}</td>
                        <td className="border border-gray-200 p-3">{staff.salary || '-'}</td>
                        <td className="border border-gray-200 p-3">{staff.working || '-'}</td>
                        <td className="border border-gray-200 p-3">{staff.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No staff details provided</p>
            )}
          </div>

          {/* Action Buttons - Only show for pending status */}
          {affiliation.status === 'pending' && (
            <div className="flex justify-between mt-8">
              <button 
                onClick={handleConfirmClick}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-md shadow"
              >
                Approve
              </button>
              <button 
                onClick={handleRejectClick}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-md shadow"
              >
                Reject
              </button>
            </div>
          )}

          {/* Status Display for non-pending forms */}
          {affiliation.status !== 'pending' && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Application Status</h3>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  affiliation.status === 'approved' 
                    ? 'bg-green-100 text-green-800' 
                    : affiliation.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {affiliation.status === 'approved' ? '✅ Approved' : 
                   affiliation.status === 'rejected' ? '❌ Rejected' : 
                   '❓ Unknown Status'}
                </span>
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
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Custom Modals */}
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirm Approval</h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to approve this mosque affiliation application? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center"
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirm Rejection</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to reject this mosque affiliation application? This action cannot be undone.
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center"
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                {alertType === 'success' && <CheckCircle className="h-8 w-8 text-green-600" />}
                {alertType === 'error' && <XCircle className="h-8 w-8 text-red-600" />}
                {alertType === 'warning' && <AlertCircle className="h-8 w-8 text-yellow-600" />}
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
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
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  alertType === 'success' ? 'bg-green-600 hover:bg-green-700' :
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

      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={showStatusChangeModal}
        onClose={() => setShowStatusChangeModal(false)}
        currentStatus={affiliation?.status}
        onStatusChange={handleStatusChange}
        loading={statusChangeLoading}
        formType="Affiliation"
      />
    </div>
  );
};

export default SuperAdminAffiliationDetails;