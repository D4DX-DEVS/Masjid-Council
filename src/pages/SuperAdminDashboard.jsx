import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  AlertCircle,
  CheckCircle,
  Menu,
  X,
  LogOut,
  Home,
  FileText,
  Heart,
  Building2,
  Users,
  User,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SuperAdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    affiliation: { total: 0, pending: 0, approved: 0, rejected: 0 },
    medicalAid: { total: 0, pending: 0, approved: 0, rejected: 0 },
    mosqueFund: { total: 0, pending: 0, approved: 0, rejected: 0 }
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [recentAdmins, setRecentAdmins] = useState([]);

  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    password: '',
    district: '',
    area: ''
  });

  const [districts, setDistricts] = useState([]);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('superAdminToken');
    if (!token) {
      navigate('/superadmin-login');
      return;
    }
    fetchAdmins();
    fetchStatistics();
    fetchRecentSubmissions();
  }, [navigate]);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_BASE_URL}/api/superadmin/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setAdmins(data.data);
        const sortedAdmins = [...data.data].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 3);
        setRecentAdmins(sortedAdmins);
      } else {
        setError(data.message || 'Failed to fetch admins');
      }
    } catch (error) {
      console.error('Fetch admins error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      
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
        medicalAid: {
          total: medicalData.data?.length || 0,
          pending: medicalData.data?.filter(item => item.status === 'pending').length || 0,
          approved: medicalData.data?.filter(item => item.status === 'approved').length || 0,
          rejected: medicalData.data?.filter(item => item.status === 'rejected').length || 0
        },
        mosqueFund: {
          total: mosqueData.data?.length || 0,
          pending: mosqueData.data?.filter(item => item.status === 'pending').length || 0,
          approved: mosqueData.data?.filter(item => item.status === 'approved').length || 0,
          rejected: mosqueData.data?.filter(item => item.status === 'rejected').length || 0
        }
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setStatsLoading(false);
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
    }
  };

  const fetchDistricts = async () => {
    setLoadingDropdowns(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/external/districts`);
      const result = await response.json();
      
      if (result.success && result.districts && Array.isArray(result.districts)) {
        setDistricts(result.districts);
      } else {
        setDistricts(getFallbackDistricts());
      }
    } catch (error) {
      setDistricts(getFallbackDistricts());
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const fetchAreasForDistrict = async (districtId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/external/areas/${districtId}`);
      const result = await response.json();
      
      if (result.success && result.areas && Array.isArray(result.areas)) {
        setFilteredAreas(result.areas);
        return result.areas;
      } else {
        const fallbackAreas = getFallbackAreas();
        setFilteredAreas(fallbackAreas);
        return fallbackAreas;
      }
    } catch (error) {
      const fallbackAreas = getFallbackAreas();
      setFilteredAreas(fallbackAreas);
      return fallbackAreas;
    }
  };

  const getFallbackDistricts = () => [
    { id: 1, title: 'Kozhikode', name: 'Kozhikode' },
    { id: 2, title: 'Malappuram', name: 'Malappuram' },
    { id: 3, title: 'Kannur', name: 'Kannur' },
    { id: 4, title: 'Kasaragod', name: 'Kasaragod' },
    { id: 5, title: 'Wayanad', name: 'Wayanad' },
    { id: 6, title: 'Thrissur', name: 'Thrissur' },
    { id: 7, title: 'Ernakulam', name: 'Ernakulam' },
    { id: 8, title: 'Kottayam', name: 'Kottayam' },
    { id: 9, title: 'Alappuzha', name: 'Alappuzha' },
    { id: 10, title: 'Pathanamthitta', name: 'Pathanamthitta' },
    { id: 11, title: 'Kollam', name: 'Kollam' },
    { id: 12, title: 'Thiruvananthapuram', name: 'Thiruvananthapuram' },
    { id: 13, title: 'Palakkad', name: 'Palakkad' },
    { id: 14, title: 'Idukki', name: 'Idukki' }
  ];

  const getFallbackAreas = () => [
    { id: 1, title: 'Kozhikode City', name: 'Kozhikode City' },
    { id: 2, title: 'Feroke', name: 'Feroke' },
    { id: 3, title: 'Koyilandy', name: 'Koyilandy' },
    { id: 4, title: 'Vadakara', name: 'Vadakara' },
    { id: 5, title: 'Thiruvambady', name: 'Thiruvambady' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'district') {
      setFormData({
        ...formData,
        district: value,
        area: ''
      });
      
      const selectedDistrict = districts.find(d => 
        (d.title || d.name) === value
      );
      
      if (selectedDistrict && selectedDistrict.id) {
        fetchAreasForDistrict(selectedDistrict.id);
      } else {
        const fallbackAreas = getFallbackAreas();
        setFilteredAreas(fallbackAreas);
      }
    } else if (name === 'phoneNumber') {
      const phoneNumber = value.replace(/\D/g, '');
      const firstFourDigits = phoneNumber.substring(0, 4);
      const autoPassword = firstFourDigits.length === 4 ? `MCK${firstFourDigits}` : '';
      
      setFormData({
        ...formData,
        phoneNumber: value,
        password: autoPassword
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    let submitData = { ...formData };
    if (!editingAdmin && formData.phoneNumber) {
      const phoneNumber = formData.phoneNumber.replace(/\D/g, '');
      const firstFourDigits = phoneNumber.substring(0, 4);
      if (firstFourDigits.length === 4) {
        submitData.password = `MCK${firstFourDigits}`;
      }
    }

    try {
      const token = localStorage.getItem('superAdminToken');
      const url = editingAdmin 
        ? `${API_BASE_URL}/api/superadmin/admin/${editingAdmin._id}`
        : `${API_BASE_URL}/api/superadmin/admin`;
      
      const method = editingAdmin ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(editingAdmin ? 'Admin updated successfully!' : 'Admin created successfully!');
        setShowModal(false);
        setFormData({
          username: '',
          phoneNumber: '',
          password: '',
          district: '',
          area: ''
        });
        setEditingAdmin(null);
        fetchAdmins();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      phoneNumber: admin.phoneNumber,
      password: '',
      district: admin.district,
      area: admin.area
    });
    setShowModal(true);
    fetchDistricts();
    
    if (admin.district) {
      const selectedDistrict = districts.find(d => 
        (d.title || d.name) === admin.district
      );
      
      if (selectedDistrict && selectedDistrict.id) {
        fetchAreasForDistrict(selectedDistrict.id);
      } else {
        const fallbackAreas = getFallbackAreas();
        setFilteredAreas(fallbackAreas);
      }
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_BASE_URL}/api/superadmin/admin/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Admin deleted successfully!');
        fetchAdmins();
      } else {
        setError(data.message || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminUser');
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormData({
      username: '',
      phoneNumber: '',
      password: '',
      district: '',
      area: ''
    });
    setShowModal(true);
    fetchDistricts();
    setFilteredAreas([]);
  };

  const filteredAdmins = admins.filter(admin =>
    admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.phoneNumber.includes(searchTerm) ||
    admin.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      approved: 'bg-green-50 text-green-800',
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
                <span className="font-bold text-gray-900 text-sm">Super Admin</span>
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
            onClick={() => navigate('/superadmin-dashboard')}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-green-50 text-[#6db14e] font-medium w-full"
          >
            <Home className="w-5 h-5" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          
          <button
            onClick={() => navigate('/superadmin-affiliation-list')}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors w-full"
          >
            <FileText className="w-5 h-5" />
            {sidebarOpen && <span>Affiliation</span>}
          </button>
          
          <button
            onClick={() => navigate('/superadmin-medical-list')}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors w-full"
          >
            <Heart className="w-5 h-5" />
            {sidebarOpen && <span>Welfare Fund</span>}
          </button>
          
          <button
            onClick={() => navigate('/superadmin-mosque-fund-list')}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors w-full"
          >
            <Building2 className="w-5 h-5" />
            {sidebarOpen && <span>Masjid Fund</span>}
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-[#6db14e] text-white hover:bg-[#5fa644] transition-colors w-full mt-4"
          >
            <Plus className="w-5 h-5" />
            {sidebarOpen && <span>Add Admin</span>}
          </button>
        </nav>

        {/* User Indicator - Above Logout */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">Super Admin</p>
                  <p className="text-xs text-gray-600 truncate">Full Access</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex justify-center">
              <div className="w-10 h-10 bg-[#6db14e] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
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

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => navigate('/superadmin-affiliation-list')}
              className="text-left rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-[#6db14e]" />
                <span className="text-3xl font-bold text-[#6db14e]">{statsLoading ? '...' : stats.affiliation.total}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Masjid Affiliation</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending:</span>
                  <span className="font-semibold text-yellow-600">{statsLoading ? '...' : stats.affiliation.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Approved:</span>
                  <span className="font-semibold text-green-600">{statsLoading ? '...' : stats.affiliation.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rejected:</span>
                  <span className="font-semibold text-red-600">{statsLoading ? '...' : stats.affiliation.rejected}</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/superadmin-medical-list')}
              className="text-left rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-blue-600">{statsLoading ? '...' : stats.medicalAid.total}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Welfare Fund</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending:</span>
                  <span className="font-semibold text-yellow-600">{statsLoading ? '...' : stats.medicalAid.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Approved:</span>
                  <span className="font-semibold text-green-600">{statsLoading ? '...' : stats.medicalAid.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rejected:</span>
                  <span className="font-semibold text-red-600">{statsLoading ? '...' : stats.medicalAid.rejected}</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/superadmin-mosque-fund-list')}
              className="text-left rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-purple-600">{statsLoading ? '...' : stats.mosqueFund.total}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Masjid Fund</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending:</span>
                  <span className="font-semibold text-yellow-600">{statsLoading ? '...' : stats.mosqueFund.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Approved:</span>
                  <span className="font-semibold text-green-600">{statsLoading ? '...' : stats.mosqueFund.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rejected:</span>
                  <span className="font-semibold text-red-600">{statsLoading ? '...' : stats.mosqueFund.rejected}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Two Column Layout for Recent Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Admins */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-[#6db14e]" />
                Recently Added Admins
              </h2>
              {recentAdmins.length > 0 ? (
                <div className="space-y-3">
                  {recentAdmins.map((admin, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-[#6db14e]" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{admin.username}</p>
                          <p className="text-xs text-gray-500">{admin.district}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(admin.createdAt).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No admins yet</p>
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

          {/* Admin Management Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#6db14e] to-[#5fa644]">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Admin Management</h2>
                <div className="flex items-center space-x-3">
                  {!showSearch ? (
                    <button
                      onClick={() => setShowSearch(true)}
                      className="flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search admins..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6db14e] text-gray-900"
                        autoFocus
                      />
                      <button
                        onClick={() => {setShowSearch(false); setSearchTerm('');}}
                        className="p-2 text-white hover:bg-white/20 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Phone Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">District</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Area</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-green-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin._id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{admin.username}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-gray-700 font-medium">{admin.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-gray-700 font-medium">{admin.district}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-gray-700 font-medium">{admin.area}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(admin)}
                            className="text-[#6db14e] hover:text-[#5fa644] p-2 rounded-lg hover:bg-green-100 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(admin._id)}
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-100 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAdmins.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base font-medium text-gray-900 mb-2">No admins found</h3>
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first admin.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 w-full max-w-md shadow-2xl rounded-xl bg-white border border-gray-200">
            <div className="flex items-center justify-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
              </h3>
            </div>
               
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#6db14e] focus:border-[#6db14e] transition-all"
                  placeholder="Enter admin username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#6db14e] focus:border-[#6db14e] transition-all"
                  placeholder="Enter 10-digit mobile number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#6db14e] focus:border-[#6db14e] transition-all"
                  required
                  disabled={loadingDropdowns}
                >
                  <option value="">{loadingDropdowns ? "Loading..." : "Select District"}</option>
                  {Array.isArray(districts) && districts.map((district) => (
                    <option key={district.id || district._id} value={district.title || district.name}>
                      {district.title || district.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Area {!formData.district && <span className="text-gray-500 font-normal">(Select district first)</span>}
                </label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#6db14e] focus:border-[#6db14e] transition-all"
                  required
                  disabled={loadingDropdowns || !formData.district}
                >
                  <option value="">
                    {!formData.district ? 'Select district first' : 'Select Area'}
                  </option>
                  {Array.isArray(filteredAreas) && filteredAreas.map((area) => (
                    <option key={area.id || area._id} value={area.title || area.name}>
                      {area.title || area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#6db14e] text-white rounded-xl hover:bg-[#5fa644] transition-all font-semibold shadow-lg"
                >
                  {editingAdmin ? 'Update Admin' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
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
                onClick={cancelLogout}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
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

export default SuperAdminDashboard;
