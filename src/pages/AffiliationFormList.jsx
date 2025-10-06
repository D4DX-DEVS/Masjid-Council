import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AffiliationFormList = () => {
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

  useEffect(() => {
    // Get the affiliation ID from location state
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
        setFormData(data.data);
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

      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/${formData._id}`, {
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
        showAlert('Form approved successfully!', 'success');
        setShowConfirmModal(false);
        // Update the local state
        setFormData({ ...formData, status: 'approved' });
      } else {
        showAlert('Failed to approve form: ' + data.message, 'error');
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error('Approve form error:', error);
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

      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/${formData._id}`, {
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
        showAlert('Form rejected successfully!', 'success');
        setShowRejectModal(false);
        setRejectionReason('');
        // Update the local state
        setFormData({ ...formData, status: 'rejected', rejectionReason: rejectionReason.trim() });
      } else {
        showAlert('Failed to reject form: ' + data.message, 'error');
        setShowRejectModal(false);
      }
    } catch (error) {
      console.error('Reject form error:', error);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{ fontFamily: "Anek Malayalam Variable" }}>
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
              <p className="text-green-200 text-xs">Affiliation Number: {formData.affiliationNumber}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 mt-4">
          {/* Basic Information */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">അടിസ്ഥാന വിവരങ്ങൾ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">പള്ളിയുടെ പേര്</label>
                <p className="text-lg font-medium text-gray-900">{formData.name || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">പള്ളിയുടെ സ്വഭാവം</label>
                <p className="text-lg font-medium text-gray-900">{formData.mosqueType || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">മഹല്ലിന്‍റെ സ്വഭാവം</label>
                <p className="text-lg font-medium text-gray-900">{formData.mahallaType || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">പ്രവർത്തനമാരംഭിച്ച വർഷം</label>
                <p className="text-lg font-medium text-gray-900">{formData.establishedYear || 'വിവരം ഇല്ല'}</p>
              </div>
            </div>
          </section>

          {/* Address Details */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">വിലാസ വിവരങ്ങൾ</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">പൂർണ വിലാസം</label>
                <p className="text-gray-900 whitespace-pre-wrap">{formData.address?.[0]?.address || 'വിവരം ഇല്ല'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ജില്ല</label>
                  <p className="text-gray-900">{formData.address?.[0]?.district || 'വിവരം ഇല്ല'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">പിൻകോഡ്</label>
                  <p className="text-gray-900">{formData.address?.[0]?.pincode || 'വിവരം ഇല്ല'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">ഫോൺ</label>
                  <p className="text-gray-900">{formData.address?.[0]?.phone || 'വിവരം ഇല്ല'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ഇ മെയിൽ</label>
                  <p className="text-gray-900">{formData.address?.[0]?.email || 'വിവരം ഇല്ല'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">വെബ്സൈറ്റ്</label>
                  <p className="text-gray-900">{formData.address?.[0]?.website || 'വിവരം ഇല്ല'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Jamaat-e-Islami Details */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">ജമാഅത്തെ ഇസ്‌ലാമി ഘടകം</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">ഏരിയ</label>
                <p className="text-gray-900">{formData.jamathArea?.[0]?.area || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">ജില്ല</label>
                <p className="text-gray-900">{formData.jamathArea?.[0]?.district || 'വിവരം ഇല്ല'}</p>
              </div>
            </div>
          </section>

          {/* Mosque Facilities */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">പള്ളിയോടനുബന്ധിച്ച ഇതര സംവിധാനങ്ങൾ</h2>
            {formData.facilities && formData.facilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {formData.facilities.map((facility, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-900">{facility}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">സംവിധാനങ്ങൾ തിരഞ്ഞെടുത്തിട്ടില്ല</p>
            )}
          </section>

          {/* Cemetery Details */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">ഖബറിസ്ഥാൻ വിവരങ്ങൾ</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">ഖബറിസ്ഥാൻ ഉണ്ടോ?</label>
                <p className="text-gray-900">{formData.hasCemetery ? 'ഉണ്ട്' : 'ഇല്ല'}</p>
                </div>
            </div>
          </section>

          {/* Mosque Specialty */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">പള്ളിയുടെ ശേഷി</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">നമസ്‌കാര ശേഷി (പേർ)</label>
                <p className="text-gray-900">{formData.mosqueCapacity || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">വിസ്തീര്‍ണം</label>
                <p className="text-gray-900">{formData.mosqueArea || 'വിവരം ഇല്ല'}</p>
              </div>
            </div>
          </section>

          {/* Juma Participants */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">ജുമുഅ പങ്കാളികൾ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">പുരുഷന്മാർ</label>
                <p className="text-lg font-medium text-gray-900">{formData.fridayMaleAttendance || '0'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">സ്ത്രീകൾ</label>
                <p className="text-lg font-medium text-gray-900">{formData.fridayFemaleAttendance || '0'}</p>
              </div>
            </div>
          </section>

          {/* Financial Details */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">സാമ്പത്തിക വിവരങ്ങൾ</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">സ്ഥാവര-ജംഗമ സ്വത്തുക്കൾ</label>
                <p className="text-gray-900 whitespace-pre-wrap">{formData.finance?.[0]?.assets || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">വരുമാന മാർഗ്ഗങ്ങൾ</label>
                <p className="text-gray-900 whitespace-pre-wrap">{formData.finance?.[0]?.incomeSource || 'വിവരം ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">പ്രതിമാസ ചെലവ് (രൂപ)</label>
                <p className="text-lg font-medium text-gray-900">₹{formData.finance?.[0]?.monthlyExpense || '0'}</p>
              </div>
            </div>
          </section>

          {/* Official Records */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">ഓഡിറ്റും രേഖകളും</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">ഓഡിറ്റ് ചെയ്യാറുണ്ടോ?</label>
                <p className="text-gray-900">{formData.audit?.[0]?.hasAudit ? 'ഉണ്ട്' : 'ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">സൂക്ഷിക്കുന്ന രേഖകൾ</label>
                {formData.audit?.[0]?.recordsKept && formData.audit[0].recordsKept.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                    {formData.audit[0].recordsKept.map((record, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-900 text-sm">{record}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">രേഖകൾ തിരഞ്ഞെടുത്തിട്ടില്ല</p>
                )}
              </div>
            </div>
          </section>

          {/* Last Year Accounts */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">കഴിഞ്ഞ വർഷത്തെ കണക്ക്</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">വരവ് (രൂപ)</label>
                <p className="text-lg font-medium text-green-600">₹{formData.accounts?.[0]?.lastYearIncome || '0'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">ചെലവ് (രൂപ)</label>
                <p className="text-lg font-medium text-red-600">₹{formData.accounts?.[0]?.lastYearExpense || '0'}</p>
              </div>
            </div>
            {formData.accounts?.[0]?.lastYearIncome && formData.accounts?.[0]?.lastYearExpense && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-600">ബാലൻസ്</label>
                <p className={`text-lg font-medium ${(parseInt(formData.accounts[0].lastYearIncome) - parseInt(formData.accounts[0].lastYearExpense)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{(parseInt(formData.accounts[0].lastYearIncome) - parseInt(formData.accounts[0].lastYearExpense)).toLocaleString()}
                </p>
              </div>
            )}
          </section>

          {/* Community Services */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">മഹല്ലിന്‍റെ / പള്ളിയുടെ മേൽനോട്ടത്തിൽ നടക്കുന്ന ജനസേവന സംരംഭങ്ങൾ</h2>
            <div className="space-y-4">
              {formData.commmunityServices && formData.commmunityServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {formData.commmunityServices.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-900">{service}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">സേവനങ്ങൾ തിരഞ്ഞെടുത്തിട്ടില്ല</p>
              )}
              {formData.otherCommunityServices && formData.otherCommunityServices.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">മറ്റുള്ളവ</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{formData.otherCommunityServices.join('\n')}</p>
                </div>
              )}
            </div>
          </section>

          {/* Managing Committee */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">മാനേജിംഗ് കമ്മിറ്റി</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">കമ്മിറ്റിയുടെ പേര്</label>
                <p className="text-gray-900">{formData.committees?.[0]?.committeeType || 'വിവരം ഇല്ല'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-3 text-blue-800">പ്രസിഡന്‍റ് / ചെയർമാൻ</h3>
                  <div className="space-y-2">
                    <p><span className="text-sm text-gray-600">പേര്:</span> {formData.committees?.[0]?.president?.[0]?.name || 'വിവരം ഇല്ല'}</p>
                    <p><span className="text-sm text-gray-600">മൊബൈൽ:</span> {formData.committees?.[0]?.president?.[0]?.phone || 'വിവരം ഇല്ല'}</p>
                    <p><span className="text-sm text-gray-600">ഇ മെയിൽ:</span> {formData.committees?.[0]?.president?.[0]?.email || 'വിവരം ഇല്ല'}</p>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium mb-3 text-green-800">സെക്രട്ടറി</h3>
                  <div className="space-y-2">
                    <p><span className="text-sm text-gray-600">പേര്:</span> {formData.committees?.[0]?.secretary?.[0]?.name || 'വിവരം ഇല്ല'}</p>
                    <p><span className="text-sm text-gray-600">മൊബൈൽ:</span> {formData.committees?.[0]?.secretary?.[0]?.phone || 'വിവരം ഇല്ല'}</p>
                    <p><span className="text-sm text-gray-600">ഇ മെയിൽ:</span> {formData.committees?.[0]?.secretary?.[0]?.email || 'വിവരം ഇല്ല'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Staff Details */}
          <section className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">ജീവനക്കാരുടെ വിവരങ്ങൾ</h2>
            {formData.committees?.[0]?.workers && formData.committees[0].workers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">വയസ്സ്</th>
                      <th className="border border-gray-300 p-3 text-left">യോഗ്യത</th>
                      <th className="border border-gray-300 p-3 text-left">ശമ്പളം</th>
                      <th className="border border-gray-300 p-3 text-left">പ്രവർത്തനം</th>
                      <th className="border border-gray-300 p-3 text-left">റിമാർക്സ്</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.committees[0].workers.map((staff, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3">{staff.age || '-'}</td>
                        <td className="border border-gray-300 p-3">{staff.qualification || '-'}</td>
                        <td className="border border-gray-300 p-3">{staff.salary || '-'}</td>
                        <td className="border border-gray-300 p-3">{staff.working || '-'}</td>
                        <td className="border border-gray-300 p-3">{staff.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">ജീവനക്കാരുടെ വിവരങ്ങൾ ചേർത്തിട്ടില്ല</p>
            )}
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">അന്യ സംസ്ഥാന ജീവനക്കാർ ഉണ്ടോ?</label>
                <p className="text-gray-900">{formData.committees?.[0]?.workers?.[0]?.otherStateWorkers ? 'ഉണ്ട്' : 'ഇല്ല'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">അന്യ സംസ്ഥാന ജീവനക്കാരെ നിയമിക്കുമ്പോൾ ആവശ്യമായ നടപടിക്രമങ്ങൾ പാലിക്കാറുണ്ടോ/രേഖകൾ സൂക്ഷിക്കാറുണ്ടോ?</label>
                <p className="text-gray-900">{formData.committees?.[0]?.workers?.[0]?.LegalOtherStateWorkers ? 'ഉണ്ട്' : 'ഇല്ല'}</p>
              </div>
            </div>
          </section>

          {/* Action Buttons - Only show for pending status */}
          {formData.status === 'pending' && (
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
          {formData.status !== 'pending' && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Form Status</h3>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  formData.status === 'approved' 
                    ? 'bg-green-100 text-green-800' 
                    : formData.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {formData.status === 'approved' ? '✅ Approved' : 
                   formData.status === 'rejected' ? '❌ Rejected' : 
                   '❓ Unknown Status'}
                </span>
              </div>
            </div>
          )}
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
                Are you sure you want to approve this mosque affiliation form? This action cannot be undone.
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
                Are you sure you want to reject this mosque affiliation form? This action cannot be undone.
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
    </div>
  );
};

export default AffiliationFormList;
