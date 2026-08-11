import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, FileText, Heart, Building2, CalendarDays, Database, IndianRupee } from 'lucide-react';
import logo from '../assets/logo.webp';
import dxLogo from '../assets/dx-logo-sml.webp';

// Logout and the account details live in the page header's profile menu, not here.
const AdminSidebar = ({ items }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Area-admin links carry ?type=…, so compare path+search when the item has one.
  const isActive = (to) =>
    to.includes('?')
      ? location.pathname + location.search === to
      : location.pathname === to && !location.search;

  // Desktop uses `label`; the mobile footer bar uses the shorter `short`.
  // Form items open the live submissions pages; old-collection records are
  // reachable from the "പഴയ രേഖകൾ" link on each submissions page.
  const navItems = items || [
    { to: '/admin-home', icon: Home, label: 'Dashboard', short: 'Home' },
    { to: '/submissions/affiliation', icon: FileText, label: 'Affiliation', short: 'Affiliation' },
    { to: '/submissions/welfarefund', icon: Heart, label: 'Welfare Fund', short: 'Welfare' },
    { to: '/submissions/mosquefund', icon: Building2, label: 'Masjid Fund', short: 'Fund' },
    { to: '/submissions/khateeb', icon: CalendarDays, label: "Mirqath '26", short: 'Mirqath' },
    { to: '/master-data', icon: Database, label: 'Master Data', short: 'Master' },
    { to: '/spending-report', icon: IndianRupee, label: 'Spending', short: 'Spend' },
  ];

  // Collapsed rail centers the icon instead of leaving it left-aligned in an 80px column.
  const row = (active) =>
    `flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} h-11 rounded-lg w-full transition-colors ${
      active ? 'bg-green-50 text-green-700 font-medium' : 'hover:bg-gray-100 text-gray-700'
    }`;

  return (
    <>
      {/* Sidebar (desktop) */}
      <div className={`print-hide hidden md:flex ${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 fixed h-full z-50 flex-col`}>
        {/* Brand and toggle */}
        <div className={`h-16 flex items-center border-b border-gray-200 ${sidebarOpen ? 'justify-between px-4' : 'justify-center px-0'}`}>
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
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${sidebarOpen ? 'px-3' : 'px-2'}`}>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} title={!sidebarOpen ? item.label : undefined} className={row(isActive(item.to))}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
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
      <div className={`print-hide hidden md:block ${sidebarOpen ? 'w-64' : 'w-20'}`}></div>

      {/* Footer menu (mobile) */}
      <nav className="print-hide md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 flex pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] ${
              isActive(item.to) ? 'text-green-700 font-semibold' : 'text-gray-500'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="truncate max-w-full px-0.5">{item.short}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

export default AdminSidebar;

