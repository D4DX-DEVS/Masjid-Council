import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, User } from 'lucide-react';
import logo from '../assets/logo.webp';
import { invalidate } from '../lib/apiCache';
import ConfirmDialog from './ConfirmDialog';

const ACCOUNTS = {
  superadmin: { storageKey: 'superAdminUser', tokenKey: 'superAdminToken', fallback: 'Super Admin', after: '/' },
  admin: { storageKey: 'adminUser', tokenKey: 'adminToken', fallback: 'Admin', after: '/admin-login' }
};

const readAccount = (role) => {
  const cfg = ACCOUNTS[role] || ACCOUNTS.admin;
  try {
    const raw = localStorage.getItem(cfg.storageKey);
    const user = raw ? JSON.parse(raw) : null;
    return {
      cfg,
      name: user?.username || cfg.fallback,
      detail: user?.district || (role === 'superadmin' ? 'Full Access' : 'District Admin')
    };
  } catch {
    return { cfg, name: cfg.fallback, detail: '' };
  }
};

// Exported so the detail pages — which keep their own in-card header — still get a logout.
export const ProfileMenu = ({ role }) => {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const boxRef = useRef(null);
  const navigate = useNavigate();
  const { cfg, name, detail } = readAccount(role);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const logout = () => {
    localStorage.removeItem(cfg.tokenKey);
    localStorage.removeItem(cfg.storageKey);
    invalidate(); // don't let the next account read this one's cached lists
    navigate(cfg.after);
  };

  return (
    <div className="relative flex-shrink-0" ref={boxRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#6db14e] flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </span>
        {/* Name lives in the dropdown — the chip stays compact at every width */}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            {detail && <p className="text-xs text-gray-500 truncate">{detail}</p>}
          </div>
          <button
            onClick={() => { setOpen(false); setConfirming(true); }}
            role="menuitem"
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="Confirm logout"
        description="Are you sure you want to logout? You will need to login again to access the panel."
        confirmLabel="Logout"
        onConfirm={logout}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
};

// Sticky top bar shared by every admin / super-admin page.
// `actions` holds the search + filter controls; on mobile it drops to its own row.
// `shortTitle` keeps long names (e.g. "Welcome back, masjidC-superadmin") readable on phones.
const PageHeader = ({ title, shortTitle, subtitle, count, titleStyle, role = 'admin', actions }) => (
  <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
    <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-8 h-14 sm:h-16">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <img src={logo} alt="Masjid Council Kerala" className="md:hidden h-8 w-auto flex-shrink-0" />
        <div className="min-w-0">
          {/* shortTitle="" hides the title on phones entirely — the logo carries the branding there */}
          <h1 className="text-sm sm:text-xl font-bold text-gray-900 tracking-tight truncate" style={titleStyle}>
            <span className={shortTitle === undefined ? undefined : 'hidden sm:inline'}>{title}</span>
            {shortTitle && <span className="sm:hidden">{shortTitle}</span>}
          </h1>
          {subtitle && <p className="hidden sm:block text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        {count != null && (
          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold flex-shrink-0">
            {count}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Desktop: actions sit inline in the bar — no separate band */}
        {actions && <div className="hidden md:flex items-center gap-2">{actions}</div>}
        <span className="hidden xl:inline-flex items-center h-9 px-3.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' })}
        </span>
        <ProfileMenu role={role} />
      </div>
    </div>

    {/* Mobile: actions drop to their own row */}
    {actions && (
      <div className="md:hidden px-3 sm:px-8 py-2.5 border-t border-gray-100 flex justify-end">{actions}</div>
    )}
  </header>
);

export default PageHeader;
