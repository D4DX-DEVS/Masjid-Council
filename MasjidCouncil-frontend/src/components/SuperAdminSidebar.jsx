import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Menu, X, LogOut, Home, FileText, Heart, Building2, User } from 'lucide-react';
import logo from '../assets/logo.png';

const SuperAdminSidebar = ({ onAddAdmin }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
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
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors w-full ${
              isActive('/superadmin-dashboard')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Home className="w-5 h-5" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          
          <button
            onClick={() => navigate('/superadmin-affiliation-list')}
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors w-full ${
              isActive('/superadmin-affiliation-list')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            {sidebarOpen && <span>Affiliation</span>}
          </button>
          
          <button
            onClick={() => navigate('/superadmin-medical-list')}
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors w-full ${
              isActive('/superadmin-medical-list')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Heart className="w-5 h-5" />
            {sidebarOpen && <span>Welfare Fund</span>}
          </button>
          
          <button
            onClick={() => navigate('/superadmin-mosque-fund-list')}
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors w-full ${
              isActive('/superadmin-mosque-fund-list')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Building2 className="w-5 h-5" />
            {sidebarOpen && <span>Masjid Fund</span>}
          </button>

          {onAddAdmin && (
            <button
              onClick={onAddAdmin}
              className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors w-full mt-4"
            >
              <Plus className="w-5 h-5" />
              {sidebarOpen && <span>Add Admin</span>}
            </button>
          )}
        </nav>

        {/* User Indicator - Above Logout */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="mb-3 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
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
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
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

      {/* Spacer to push content */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'}`}></div>
    </>
  );
};

export default SuperAdminSidebar;

