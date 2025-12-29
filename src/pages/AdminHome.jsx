import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Menu, X, LogOut, Home, FileText, Heart, Building2, User, AlertCircle } from "lucide-react";
import logo from '../assets/logo.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    affiliation: { total: 0, pending: 0, approved: 0, rejected: 0 },
    medical: { total: 0, pending: 0, approved: 0, rejected: 0 },
    mosque: { total: 0, pending: 0, approved: 0, rejected: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminInfo, setAdminInfo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchStatistics();
    loadAdminInfo();
    fetchRecentSubmissions();
  }, []);

  const loadAdminInfo = () => {
    try {
      const adminData = localStorage.getItem('adminUser');
      if (adminData) {
        setAdminInfo(JSON.parse(adminData));
      }
    } catch (error) {
      console.error('Error loading admin info:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const affiliationResponse = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/all`);
      const affiliationData = await affiliationResponse.json();
      
      const medicalResponse = await fetch(`${API_BASE_URL}/api/welfarefund/all`);
      const medicalData = await medicalResponse.json();
      
      const mosqueResponse = await fetch(`${API_BASE_URL}/api/mosqueFund/all`);
      const mosqueData = await mosqueResponse.json();
      
      setStats({
        affiliation: {
          total: affiliationData.data?.length || 0,
          pending: affiliationData.data?.filter(item => item.status === 'pending').length || 0,
          approved: affiliationData.data?.filter(item => item.status === 'approved').length || 0,
          rejected: affiliationData.data?.filter(item => item.status === 'rejected').length || 0
        },
        medical: {
          total: medicalData.data?.length || 0,
          pending: medicalData.data?.filter(item => item.status === 'pending').length || 0,
          approved: medicalData.data?.filter(item => item.status === 'approved').length || 0,
          rejected: medicalData.data?.filter(item => item.status === 'rejected').length || 0
        },
        mosque: {
          total: mosqueData.data?.length || 0,
          pending: mosqueData.data?.filter(item => item.status === 'pending').length || 0,
          approved: mosqueData.data?.filter(item => item.status === 'approved').length || 0,
          rejected: mosqueData.data?.filter(item => item.status === 'rejected').length || 0
        }
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSubmissions = async () => {
    try {
      const affiliationResponse = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/all`);
      const affiliationData = await affiliationResponse.json();
      
      const medicalResponse = await fetch(`${API_BASE_URL}/api/welfarefund/all`);
      const medicalData = await medicalResponse.json();
      
      const mosqueResponse = await fetch(`${API_BASE_URL}/api/mosqueFund/all`);
      const mosqueData = await mosqueResponse.json();

      const allSubmissions = [
        ...(affiliationData.data || []).map(item => ({ ...item, type: 'affiliation' })),
        ...(medicalData.data || []).map(item => ({ ...item, type: 'medical' })),
        ...(mosqueData.data || []).map(item => ({ ...item, type: 'mosque' }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

      setRecentSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
      // Keep the dashboard usable even if this fails
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin-login');
  };

  const getTypeDisplay = (type) => {
    const types = {
      affiliation: { text: 'Affiliation', color: 'bg-blue-100 text-blue-800', icon: FileText },
      medical: { text: 'Welfare Fund', color: 'bg-green-100 text-green-800', icon: Heart },
      mosque: { text: 'Masjid Fund', color: 'bg-purple-100 text-purple-800', icon: Building2 }
    };
    return types[type] || types.affiliation;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6db14e] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-xl transition-all duration-300 fixed h-full z-50 flex flex-col`}>
        {/* Logo and Toggle */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <img src={logo} alt="MCK Logo" className="h-10 w-auto" />
                <span className="font-bold text-gray-900 text-sm">MCK Admin</span>
              </div>
            )}
            {!sidebarOpen && (
              <img src={logo} alt="MCK Logo" className="h-10 w-auto mx-auto" />
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${!sidebarOpen ? 'mx-auto mt-2' : ''}`}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => navigate('/admin-home')}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-green-50 text-[#6db14e] font-medium w-full"
          >
            <Home className="w-5 h-5" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          
          <button
            onClick={() => navigate('/affiliation-list-admin')}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors w-full"
          >
            <FileText className="w-5 h-5" />
            {sidebarOpen && <span>Affiliation</span>}
          </button>
          
          <button
            onClick={() => navigate('/medical-list-admin')}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors w-full"
          >
            <Heart className="w-5 h-5" />
            {sidebarOpen && <span>Welfare Fund</span>}
          </button>
          
          <button
            onClick={() => navigate('/mosque-list-admin')}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors w-full"
          >
            <Building2 className="w-5 h-5" />
            {sidebarOpen && <span>Masjid Fund</span>}
          </button>
        </nav>

        {/* User Info - Above Logout */}
        {adminInfo && (
          <div className="p-4 border-t border-gray-200">
            {sidebarOpen ? (
              <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{adminInfo.username}</p>
                    <p className="text-xs text-gray-600 truncate">{adminInfo.district}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3 flex justify-center">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content - No Header */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <div className="p-8">
          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => navigate('/affiliation-list-admin')}
              className="text-left rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-[#6db14e]" />
                <span className="text-3xl font-bold text-[#6db14e]">{stats.affiliation.total}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Masjid Affiliation</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending:</span>
                  <span className="font-semibold text-yellow-600">{stats.affiliation.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Approved:</span>
                  <span className="font-semibold text-green-600">{stats.affiliation.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rejected:</span>
                  <span className="font-semibold text-red-600">{stats.affiliation.rejected}</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/medical-list-admin')}
              className="text-left rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-blue-600">{stats.medical.total}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Welfare Fund</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending:</span>
                  <span className="font-semibold text-yellow-600">{stats.medical.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Approved:</span>
                  <span className="font-semibold text-green-600">{stats.medical.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rejected:</span>
                  <span className="font-semibold text-red-600">{stats.medical.rejected}</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/mosque-list-admin')}
              className="text-left rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-purple-600">{stats.mosque.total}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Masjid Fund</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending:</span>
                  <span className="font-semibold text-yellow-600">{stats.mosque.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Approved:</span>
                  <span className="font-semibold text-green-600">{stats.mosque.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rejected:</span>
                  <span className="font-semibold text-red-600">{stats.mosque.rejected}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Admin Profile */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-[#6db14e]" />
                Admin Profile
              </h2>
              {adminInfo ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[#6db14e]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{adminInfo.username}</p>
                        <p className="text-xs text-gray-500">{adminInfo.district}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No admin info found</p>
                </div>
              )}
          </div>

          {/* Recent Submissions */}
          <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-[#6db14e]" />
                Recent Submissions
            </h2>
            {recentSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {recentSubmissions.slice(0, 3).map((submission, index) => {
                  const typeInfo = getTypeDisplay(submission.type);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 ${typeInfo.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                            {submission.name || submission.mosqueName || 'Unknown'}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(submission.status)}`}>
                              {submission.status}
                            </span>
                          </div>
                        </div>
                      </div>
                        <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs text-gray-500">
                          {new Date(submission.createdAt).toLocaleDateString('en-GB')}
                        </p>
                        </div>
                    </div>
                  );
                })}
              </div>
            ) : (
                <div className="text-center py-4 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No recent submissions</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <LogOut className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Confirm Logout
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHome;
