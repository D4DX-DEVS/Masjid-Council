import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Menu, X, Home, FileText, Heart, Building2, CalendarDays, Database, Wrench, IndianRupee , BookOpen} from 'lucide-react';
import logo from '../assets/logo.webp';
import dxLogo from '../assets/dx-logo-sml.webp';

// Logout and the account details live in the page header's profile menu, not here.
const SuperAdminSidebar = ({ onAddAdmin }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Desktop uses `label`; the mobile footer bar uses the shorter `short`.
  // Form items open the live submissions pages; old-collection records are
  // reachable from the "പഴയ രേഖകൾ" link on each submissions page.
  const navItems = [
    { to: '/superadmin-dashboard', icon: Home, label: 'Dashboard', short: 'Home' },
    { to: '/superadmin-submissions/affiliation', icon: FileText, label: 'Affiliation', short: 'Affiliation' },
    { to: '/superadmin-submissions/welfarefund', icon: Heart, label: 'Welfare Fund', short: 'Welfare' },
    { to: '/superadmin-submissions/mosquefund', icon: Building2, label: 'Masjid Fund', short: 'Fund' },
    { to: '/superadmin-submissions/khateeb', icon: CalendarDays, label: "Mirqath '26", short: 'Mirqath' },
    { to: '/master-data', icon: Database, label: 'Master Data', short: 'Master' },
    { to: '/superadmin-form-builder', icon: Wrench, label: 'Form Builder', short: 'Forms' },
    { to: '/superadmin-spending-report', icon: IndianRupee, label: 'Spending', short: 'Spend' },
    { to: '/superadmin-publications', icon: BookOpen, label: 'Publications', short: 'Books' },
  ];

  return (
    <>
      {/* Sidebar (desktop) */}
      <div className={`print-hide hidden md:flex ${sidebarOpen ? 'w-[280px]' : 'w-[90px]'} bg-white border-r border-[#E5E7EB] transition-all duration-300 fixed h-full z-50 flex-col`} style={{ boxShadow: '0 6px 24px rgba(0,0,0,.04)' }}>
        {/* Brand and toggle */}
        <div className={`h-16 flex items-center border-b border-gray-100 ${sidebarOpen ? 'justify-between px-5' : 'justify-center px-0'}`}>
          {sidebarOpen && <img src={logo} alt="Masjid Council Kerala" className="h-9 w-auto flex-shrink-0" />}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors flex-shrink-0"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-5 space-y-1 overflow-y-auto ${sidebarOpen ? 'px-4' : 'px-3'}`}>
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                title={!sidebarOpen ? item.label : undefined}
                className={`relative flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} h-12 rounded-xl w-full transition-colors ${
                  active ? 'bg-[#EAF6EF] text-[#1F6B3A] font-semibold' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                {active && <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-[#1F6B3A]" />}
                <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${active ? 'bg-white' : 'bg-gray-50'}`}>
                  <item.icon className="w-[18px] h-[18px]" />
                </span>
                {sidebarOpen && <span className="truncate text-sm">{item.label}</span>}
              </button>
            );
          })}

          {onAddAdmin && (
            <div className={`pt-5 mt-4 border-t border-gray-100 ${sidebarOpen ? '' : 'flex justify-center'}`}>
              {sidebarOpen && (
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Quick Actions</p>
              )}
              <button
                onClick={onAddAdmin}
                title={!sidebarOpen ? 'Add Admin' : undefined}
                className={`flex items-center ${sidebarOpen ? 'gap-3 px-3 w-full' : 'justify-center w-12'} h-12 rounded-xl bg-[#1F6B3A] text-white hover:bg-[#2E7D4F] transition-colors shadow-sm`}
              >
                <Plus className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-semibold">Add Admin</span>}
              </button>
            </div>
          )}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-gray-100">
            <a
              href="https://www.d4dx.co"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              Powered by
              <img src={dxLogo} alt="D4DX Innovations LLP" className="h-8 w-auto flex-shrink-0" />
            </a>
          </div>
        )}
      </div>

      {/* Spacer to push content (desktop only) */}
      <div className={`print-hide hidden md:block ${sidebarOpen ? 'w-[280px]' : 'w-[90px]'} flex-shrink-0`}></div>

      {/* Footer menu (mobile) */}
      <nav className="print-hide md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 flex pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] ${
              isActive(item.to) ? 'text-[#1F6B3A] font-semibold' : 'text-gray-500'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="truncate max-w-full px-0.5">{item.short}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default SuperAdminSidebar;
