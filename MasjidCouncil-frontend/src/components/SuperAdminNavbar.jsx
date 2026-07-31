import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

// Import Cinzel font
const cinzelFont = {
  fontFamily: "'Cinzel', serif"
};

const SuperAdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
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

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: '/superadmin-dashboard',
      label: 'Dashboard'
    },
    {
      path: '/superadmin-affiliation-list',
      label: 'Affiliation'
    },
    {
      path: '/superadmin-medical-list',
      label: 'Welfare Fund'
    },
    {
      path: '/superadmin-mosque-fund-list',
      label: 'Masjid Fund'
    }
  ];

  return (
    <>
      <header>
      {/* Top green gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#239a5a] via-[#6db14e] to-green-700" />

      {/* Main navbar content */}
      <nav className="bg-white shadow">
        <div className="px-4 md:px-8 lg:px-16">
          <div className="mx-auto max-w-7xl flex items-center justify-between py-4">
            {/* Logo and Text */}
            <div className="flex items-center space-x-3">
              <div className="w-32 h-10 rounded-full flex items-center justify-center">
                <img src={logo} alt="Masjid Council Kerala" className="h-15 w-24" />
              </div>
            </div>

            {/* Desktop Navigation Links - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`text-base font-semibold tracking-wide transition-all duration-300 hover:scale-105 px-3 py-2 ${
                    isActive(item.path)
                      ? 'text-green-600'
                      : 'text-black hover:text-green-600'
                  }`}
                  style={cinzelFont}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Desktop Right side - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={handleLogout}
                className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition duration-200"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 p-2 rounded-md"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu - Visible only when open */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`text-base font-semibold tracking-wide transition-all duration-300 hover:scale-105 block px-3 py-2 w-full text-left ${
                    isActive(item.path)
                      ? 'text-green-600'
                      : 'text-black hover:text-green-600'
                  }`}
                  style={cinzelFont}
                >
                  {item.label}
                </button>
              ))}
              
              {/* Mobile Logout Button */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-md transition duration-200 w-full"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      </header>

      {/* Logout Confirmation Modal */}
    {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-600/60 backdrop-blur-md overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white/90 backdrop-blur-lg border-white/20">
            <div className="mt-3">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to logout? You will need to login again to access the super admin panel.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuperAdminNavbar;




