import React, { useState } from 'react';
import { Shield, Eye, EyeOff, User, Lock, LoaderCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import loginSuper from '../assets/LoginSuper.jpg';

// Import Google Fonts
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cinzel&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SuperAdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.token) {
        // Store token in localStorage
        localStorage.setItem('superAdminToken', data.token);
        // Create a user object with the username from form data
        const userData = {
          username: formData.username,
          role: 'superadmin'
        };
        localStorage.setItem('superAdminUser', JSON.stringify(userData));
        
        // Navigate to super admin dashboard
        navigate('/superadmin-dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex overflow-hidden">
      {/* Desktop: image gets its own half, matching the photo's portrait aspect */}
      <div
        className="hidden lg:block w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url(${loginSuper})` }}
      />

      {/* Form side */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center px-4 pb-4 pt-20 sm:px-6 sm:pb-6 sm:pt-6 lg:p-10">
        {/* Mobile: full-bleed image behind the card */}
        <div
          className="absolute inset-0 lg:hidden bg-cover bg-center"
          style={{ backgroundImage: `url(${loginSuper})` }}
        />
        <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-white/60 to-white/70" />
        {/* Desktop: soft panel behind the card */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50" />

      {/* Card */}
      <div className="relative z-20 w-full max-w-md">
        <div className="rounded-3xl bg-white/75 backdrop-blur-2xl ring-1 ring-white/70 shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <img src={logo} alt="Masjid Council Kerala" className="h-12 sm:h-14 w-auto shrink-0" />
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100 rounded-full px-2 py-0.5 mb-1">
                <Shield className="h-3 w-3" />
                Restricted
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Super Admin Login</h1>
              <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full mt-2" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 ring-1 ring-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-3 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-11 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Arabic ayah */}
          <p
            className="mt-6 pt-5 border-t border-gray-200/70 text-center text-lg sm:text-xl text-gray-600"
            dir="rtl"
            style={{ fontFamily: 'Amiri, serif' }}
          >
            وَأَنَّ ٱلْمَسَٰجِدَ لِلَّهِ فَلَا تَدْعُواْ مَعَ ٱللَّهِ أَحَدًا
          </p>

          {/* Back to Admin Login */}
          <button
            type="button"
            onClick={() => navigate('/admin-login')}
            className="mt-5 w-full inline-flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Admin Login
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;