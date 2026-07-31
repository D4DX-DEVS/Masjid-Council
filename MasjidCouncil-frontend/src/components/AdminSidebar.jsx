import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home, FileText, Heart, Building2, User, CalendarDays } from 'lucide-react';
import logo from '../assets/logo.png';

const AdminSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadAdminInfo();
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

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin-login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Same destinations as the desktop sidebar, short labels for the mobile footer bar
  const navItems = [
    { to: '/admin-home', icon: Home, label: 'Home' },
    { to: '/affiliation-list-admin', icon: FileText, label: 'Affiliation' },
    { to: '/medical-list-admin', icon: Heart, label: 'Welfare' },
    { to: '/mosque-list-admin', icon: Building2, label: 'Fund' },
    { to: '/khateeb-list-admin', icon: CalendarDays, label: 'Mirqath' },
  ];

  return (
    <>
      {/* Sidebar (desktop) */}
      <div className={`hidden md:flex ${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-xl transition-all duration-300 fixed h-full z-50 flex-col`}>
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
          <Link
            to="/admin-home"
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
              isActive('/admin-home')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Home className="w-5 h-5" />
            {sidebarOpen && <span>Dashboard</span>}
          </Link>
          
          <Link
            to="/affiliation-list-admin"
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
              isActive('/affiliation-list-admin')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            {sidebarOpen && <span>Affiliation</span>}
          </Link>
          
          <Link
            to="/medical-list-admin"
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
              isActive('/medical-list-admin')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Heart className="w-5 h-5" />
            {sidebarOpen && <span>Welfare Fund</span>}
          </Link>
          
          <Link
            to="/mosque-list-admin"
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
              isActive('/mosque-list-admin')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Building2 className="w-5 h-5" />
            {sidebarOpen && <span>Masjid Fund</span>}
          </Link>

          <Link
            to="/khateeb-list-admin"
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
              isActive('/khateeb-list-admin')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            {sidebarOpen && <span>Mirqath '26</span>}
          </Link>
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

      {/* Spacer to push content (desktop only) */}
      <div className={`hidden md:block ${sidebarOpen ? 'w-64' : 'w-20'}`}></div>

      {/* Footer menu (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] ${
                isActive(item.to) ? 'text-green-700 font-semibold' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-full px-0.5">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
};

export default AdminSidebar;

