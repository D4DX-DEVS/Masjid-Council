import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SuperAdminNavbar from '../components/SuperAdminNavbar';
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
  const navigate = useNavigate();

  // Statistics state
  const [stats, setStats] = useState({
    affiliation: { total: 0, pending: 0, approved: 0, rejected: 0 },
    medicalAid: { total: 0, pending: 0, approved: 0, rejected: 0 },
    mosqueFund: { total: 0, pending: 0, approved: 0, rejected: 0 }
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    password: '',
    district: '',
    area: ''
  });

  // State for dropdown data
  const [districts, setDistricts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('superAdminToken');
    if (!token) {
      navigate('/superadmin-login');
      return;
    }
    fetchAdmins();
    fetchStatistics();
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
      
      // Fetch affiliation data
      const affiliationResponse = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/all`);
      const affiliationData = await affiliationResponse.json();
      
      // Fetch medical aid data
      const medicalResponse = await fetch(`${API_BASE_URL}/api/welfarefund/all`);
      const medicalData = await medicalResponse.json();
      
      // Fetch mosque fund data
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

  // Fetch districts from external API using new Malarvadi pattern
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

  // Fetch areas for a specific district using new Malarvadi pattern
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

  // Fallback data for districts
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

  // Fallback data for areas
  const getFallbackAreas = () => [
    { id: 1, title: 'Kozhikode City', name: 'Kozhikode City' },
    { id: 2, title: 'Feroke', name: 'Feroke' },
    { id: 3, title: 'Koyilandy', name: 'Koyilandy' },
    { id: 4, title: 'Vadakara', name: 'Vadakara' },
    { id: 5, title: 'Thiruvambady', name: 'Thiruvambady' },
    { id: 6, title: 'Koduvally', name: 'Koduvally' },
    { id: 7, title: 'Balussery', name: 'Balussery' },
    { id: 8, title: 'Perambra', name: 'Perambra' },
    { id: 9, title: 'Thiruvallur', name: 'Thiruvallur' },
    { id: 10, title: 'Elathur', name: 'Elathur' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'district') {
      // When district changes, fetch areas for that district using new API
      setFormData({
        ...formData,
        district: value,
        area: '' // Reset area when district changes
      });
      
      // Find the district ID to fetch areas
      const selectedDistrict = districts.find(d => 
        (d.title || d.name) === value
      );
      
      if (selectedDistrict && selectedDistrict.id) {
        fetchAreasForDistrict(selectedDistrict.id);
      } else {
        // If no district ID found, use fallback areas
        const fallbackAreas = getFallbackAreas();
        setFilteredAreas(fallbackAreas);
      }
    } else if (name === 'phoneNumber') {
      // When phone number changes, auto-generate password
      const phoneNumber = value.replace(/\D/g, ''); // Remove non-digits
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

    // For new admin creation, ensure password is auto-generated
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
      password: '', // Don't pre-fill password
      district: admin.district,
      area: admin.area
    });
    setShowModal(true);
    fetchDistricts();
    
    // Filter areas based on the admin's district
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
    // Reset filtered areas to show all areas initially
    setFilteredAreas(areas);
  };

  const filteredAdmins = admins.filter(admin =>
    admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.phoneNumber.includes(searchTerm) ||
    admin.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SuperAdminNavbar />

      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Professional Header Section */}
          <div className="mb-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">സൂപ്പർ അഡ്മിൻ ഡാഷ്ബോർഡ്</h1>
              <div className="w-24 h-1 bg-emerald-600 mx-auto rounded-full"></div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/superadmin-affiliation-list')}
                className="group rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all text-left"
                style={{ backgroundColor: '#f2f8ed' }}
              >
                <div>
                  <h3 className="font-bold text-gray-900 text-2xl mb-3">Masjid Affiliation</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total:</span>
                      <span className="text-lg font-bold text-emerald-600">{statsLoading ? '...' : stats.affiliation.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Pending:</span>
                      <span className="text-sm font-semibold text-yellow-600">{statsLoading ? '...' : stats.affiliation.pending}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Approved:</span>
                      <span className="text-sm font-semibold text-green-600">{statsLoading ? '...' : stats.affiliation.approved}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Rejected:</span>
                      <span className="text-sm font-semibold text-red-600">{statsLoading ? '...' : stats.affiliation.rejected}</span>
                  </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/superadmin-medical-list')}
                className="group rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all text-left"
                style={{ backgroundColor: '#f2f8ed' }}
              >
                <div>
                  <h3 className="font-bold text-gray-900 text-2xl mb-3">Welfare Fund</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total:</span>
                      <span className="text-lg font-bold text-blue-600">{statsLoading ? '...' : stats.medicalAid.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Pending:</span>
                      <span className="text-sm font-semibold text-yellow-600">{statsLoading ? '...' : stats.medicalAid.pending}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Approved:</span>
                      <span className="text-sm font-semibold text-green-600">{statsLoading ? '...' : stats.medicalAid.approved}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Rejected:</span>
                      <span className="text-sm font-semibold text-red-600">{statsLoading ? '...' : stats.medicalAid.rejected}</span>
                  </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/superadmin-mosque-fund-list')}
                className="group rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all text-left"
                style={{ backgroundColor: '#f2f8ed' }}
              >
                <div>
                  <h3 className="font-bold text-gray-900 text-2xl mb-3">Masjid Fund</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total:</span>
                      <span className="text-lg font-bold text-purple-600">{statsLoading ? '...' : stats.mosqueFund.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Pending:</span>
                      <span className="text-sm font-semibold text-yellow-600">{statsLoading ? '...' : stats.mosqueFund.pending}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Approved:</span>
                      <span className="text-sm font-semibold text-green-600">{statsLoading ? '...' : stats.mosqueFund.approved}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Rejected:</span>
                      <span className="text-sm font-semibold text-red-600">{statsLoading ? '...' : stats.mosqueFund.rejected}</span>
                  </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

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

          {/* Admin Management Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-200" style={{background: 'linear-gradient(to right, #7bb85c, #7bb85c)'}}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Admin Management</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                <button
                      onClick={() => setShowSearch(!showSearch)}
                      className="flex items-center px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                      title="Search"
                >
                      <Search className="h-4 w-4 font-bold" />
                </button>
                    
                    {/* Animated Search Bar */}
                    <div className={`absolute right-0 top-full mt-2 transition-all duration-300 ease-in-out ${
                      showSearch 
                        ? 'opacity-100 translate-y-0 scale-100' 
                        : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
                    }`}>
                      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-80">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search admins..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                autoFocus
                    />
                  </div>
                </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                    {filteredAdmins.length} admins
                  </span>
                  {searchTerm && (
                <button
                      onClick={() => setSearchTerm('')}
                                className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                >
                      Clear
                </button>
                  )}
                          </div>
                        </div>
                </div>
              </div>
            </div>
                  
                  <button
                    onClick={openCreateModal}
                    className="flex items-center px-6 py-3 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-sm transform hover:scale-105"
                    style={{
                      background: 'linear-gradient(to right, #477d33, #3a6b2a)',
                      '&:hover': {
                        background: 'linear-gradient(to right, #3a6b2a, #2d5a1f)'
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(to right, #3a6b2a, #2d5a1f)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(to right, #477d33, #3a6b2a)';
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Admin
                  </button>
                </div>
              </div>
            </div>

            {/* Admins Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full rounded-lg overflow-hidden">
                <thead className="bg-gray-50 border-b border-gray-200" style={{borderRadius: '0.75rem 0.75rem 0 0'}}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider rounded-tl-lg">
                      Username
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      Area
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider rounded-tr-lg">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredAdmins.map((admin, idx) => (
                    <tr key={admin._id} className="hover:bg-emerald-50/30 transition-all duration-200 border-b border-gray-100">
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
                            className="text-emerald-600 hover:text-emerald-700 p-2.5 rounded-lg hover:bg-emerald-100 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Edit Admin"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(admin._id)}
                            className="text-red-600 hover:text-red-700 p-2.5 rounded-lg hover:bg-red-100 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Delete Admin"
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
              <img src={logo} alt="Masjid Council Kerala" className="w-22 h-18   object-contain mr-4" />
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
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
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
                     className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
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
                     className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900"
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
                     className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-gray-900"
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
                    className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    style={{
                      background: 'linear-gradient(to right, #6db14e, #5a9e44)',
                      '&:hover': {
                        background: 'linear-gradient(to right, #5a9e44, #4a8a3a)'
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(to right, #5a9e44, #4a8a3a)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(to right, #6db14e, #5a9e44)';
                    }}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 w-full max-w-md shadow-2xl rounded-xl bg-white border border-gray-200">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 bg-red-500 rounded-full"></div>
                </div>
              </div>
              
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                Confirm Logout
              </h3>
            <p className="text-gray-500 text-center mb-8">
                Are you sure you want to logout? You will need to login again to access the dashboard.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelLogout}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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
