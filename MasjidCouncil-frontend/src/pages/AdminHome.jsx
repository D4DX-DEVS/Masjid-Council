import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, FileText, Heart, Building2, User, AlertCircle, CalendarDays } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import { StatCardsSkeleton, SkeletonBar } from "../components/Skeleton";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    affiliation: { total: 0, pending: 0, approved: 0, rejected: 0 },
    medical: { total: 0, pending: 0, approved: 0, rejected: 0 },
    mosque: { total: 0, pending: 0, approved: 0, rejected: 0 },
    khateeb: { total: 0, pending: 0, approved: 0, rejected: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminInfo, setAdminInfo] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);

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

      const khateebResponse = await fetch(`${API_BASE_URL}/api/khateebRegistration/all`);
      const khateebData = await khateebResponse.json();

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
        },
        khateeb: {
          total: khateebData.data?.length || 0,
          pending: khateebData.data?.filter(item => item.status === 'pending').length || 0,
          approved: khateebData.data?.filter(item => item.status === 'approved').length || 0,
          rejected: khateebData.data?.filter(item => item.status === 'rejected').length || 0
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

      const khateebResponse = await fetch(`${API_BASE_URL}/api/khateebRegistration/all`);
      const khateebData = await khateebResponse.json();

      const allSubmissions = [
        ...(affiliationData.data || []).map(item => ({ ...item, type: 'affiliation' })),
        ...(medicalData.data || []).map(item => ({ ...item, type: 'medical' })),
        ...(mosqueData.data || []).map(item => ({ ...item, type: 'mosque' })),
        ...(khateebData.data || []).map(item => ({ ...item, type: 'khateeb' }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

      setRecentSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
      // Keep the dashboard usable even if this fails
    }
  };


  const getTypeDisplay = (type) => {
    const types = {
      affiliation: { text: 'Affiliation', color: 'bg-blue-100 text-blue-800', icon: FileText },
      medical: { text: 'Welfare Fund', color: 'bg-green-100 text-green-800', icon: Heart },
      mosque: { text: 'Masjid Fund', color: 'bg-purple-100 text-purple-800', icon: Building2 },
      khateeb: { text: "Mirqath '26", color: 'bg-amber-100 text-amber-800', icon: CalendarDays }
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

  // Keep the shell (and the mobile footer menu) mounted while data loads
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <div className="p-4 sm:p-8 pb-24 md:pb-8">
            <StatCardsSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonBar className="h-48 w-full rounded-xl" />
              <SkeletonBar className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      {/* Main Content - No Header */}
      <div className="flex-1 min-w-0">
        <div className="p-4 sm:p-8 pb-24 md:pb-8">
          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <button
              onClick={() => navigate('/affiliation-list-admin')}
              className="text-left rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all bg-white"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-3 mb-1 sm:mb-2">
                <FileText className="order-1 w-5 h-5 sm:w-7 sm:h-7 shrink-0 text-[#6db14e]" />
                <h3 className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1 min-w-0 font-bold text-gray-900 text-sm sm:text-lg xl:text-xl leading-tight">Masjid Affiliation</h3>
                <span className="order-2 ml-auto sm:order-3 sm:ml-0 text-xl sm:text-3xl font-bold text-[#6db14e]">{stats.affiliation.total}</span>
              </div>
              <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Pending:</span>
                  <span className="font-semibold text-yellow-600">{stats.affiliation.pending}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Approved:</span>
                  <span className="font-semibold text-green-600">{stats.affiliation.approved}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Rejected:</span>
                  <span className="font-semibold text-red-600">{stats.affiliation.rejected}</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/medical-list-admin')}
              className="text-left rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all bg-white"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-3 mb-1 sm:mb-2">
                <Heart className="order-1 w-5 h-5 sm:w-7 sm:h-7 shrink-0 text-blue-600" />
                <h3 className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1 min-w-0 font-bold text-gray-900 text-sm sm:text-lg xl:text-xl leading-tight">Welfare Fund</h3>
                <span className="order-2 ml-auto sm:order-3 sm:ml-0 text-xl sm:text-3xl font-bold text-blue-600">{stats.medical.total}</span>
              </div>
              <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Pending:</span>
                  <span className="font-semibold text-yellow-600">{stats.medical.pending}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Approved:</span>
                  <span className="font-semibold text-green-600">{stats.medical.approved}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Rejected:</span>
                  <span className="font-semibold text-red-600">{stats.medical.rejected}</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/mosque-list-admin')}
              className="text-left rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all bg-white"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-3 mb-1 sm:mb-2">
                <Building2 className="order-1 w-5 h-5 sm:w-7 sm:h-7 shrink-0 text-purple-600" />
                <h3 className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1 min-w-0 font-bold text-gray-900 text-sm sm:text-lg xl:text-xl leading-tight">Masjid Fund</h3>
                <span className="order-2 ml-auto sm:order-3 sm:ml-0 text-xl sm:text-3xl font-bold text-purple-600">{stats.mosque.total}</span>
              </div>
              <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Pending:</span>
                  <span className="font-semibold text-yellow-600">{stats.mosque.pending}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Approved:</span>
                  <span className="font-semibold text-green-600">{stats.mosque.approved}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Rejected:</span>
                  <span className="font-semibold text-red-600">{stats.mosque.rejected}</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/khateeb-list-admin')}
              className="text-left rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all bg-white"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-3 mb-1 sm:mb-2">
                <CalendarDays className="order-1 w-5 h-5 sm:w-7 sm:h-7 shrink-0 text-amber-600" />
                <h3 className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1 min-w-0 font-bold text-gray-900 text-sm sm:text-lg xl:text-xl leading-tight">Mirqath '26</h3>
                <span className="order-2 ml-auto sm:order-3 sm:ml-0 text-xl sm:text-3xl font-bold text-amber-600">{stats.khateeb.total}</span>
              </div>
              <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm">
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Pending:</span>
                  <span className="font-semibold text-yellow-600">{stats.khateeb.pending}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Approved:</span>
                  <span className="font-semibold text-green-600">{stats.khateeb.approved}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-gray-500">Rejected:</span>
                  <span className="font-semibold text-red-600">{stats.khateeb.rejected}</span>
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
                            {submission.name || submission.mosqueName || submission.fullName || 'Unknown'}
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

    </div>
  );
};

export default AdminHome;
