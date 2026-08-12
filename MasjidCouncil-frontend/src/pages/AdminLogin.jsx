import React, { useState } from 'react';
import { Home, Info, ArrowRight, ChevronDown, Smartphone, Lock, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.webp';
import adminLogin from '../assets/adminLogin.webp';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminLogin = () => {
  const navigate = useNavigate();
  // Admins sign in with their mobile number, area admins with their roster username.
  const [formData, setFormData] = useState({
    loginId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

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
      const response = await fetch(`${API_BASE_URL}/api/superadmin/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        
        // Area admins get their own scoped dashboard
        navigate(data.user.role === 'areaadmin' ? '/area-home' : '/admin-home');
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

  const handleSuperAdminClick = () => {
    navigate('/superadmin-login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center lg:justify-end px-4 pb-4 pt-20 sm:px-6 sm:pb-6 sm:pt-6 lg:px-16 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${adminLogin})` }}
      />
      {/* Readability overlay - keeps the masjid visible on the left, softens behind the card */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/70 lg:bg-gradient-to-r lg:from-white/10 lg:via-white/30 lg:to-white/75" />

      {/* Home Button (Top Right) */}
      <button
        type="button"
        onClick={handleGoHome}
        title="Go to Home"
        aria-label="Go to Home"
        className="absolute top-5 right-5 z-30 inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/70 backdrop-blur-md hover:bg-white shadow-lg ring-1 ring-white/60 text-gray-700 hover:text-green-700 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <Home className="h-5 w-5" />
      </button>

      {/* Card */}
      <div className="relative z-20 w-full max-w-md">
        <div className="rounded-3xl bg-white/75 backdrop-blur-2xl ring-1 ring-white/70 shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <img src={logo} alt="Masjid Council Kerala" className="h-12 sm:h-14 w-auto shrink-0" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Admin Login</h1>
              <p className="text-sm text-gray-600">അഡ്മിൻ ലോഗിൻ</p>
              <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-2" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 ring-1 ring-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 flex items-center text-sm">
              <Info className="h-4 w-4 mr-2 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username / Mobile <span className="text-gray-400">(യൂസർനെയിം / മൊബൈൽ)</span>
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="loginId"
                  value={formData.loginId}
                  onChange={handleChange}
                  autoComplete="username"
                  className="w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-3 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all"
                  placeholder="Username or mobile number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-gray-400">(പാസ്വേഡ്)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-11 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-green-600/20 transition-all hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-2"
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

            <button
              type="button"
              className="w-full bg-white/70 hover:bg-white ring-1 ring-gray-200 text-gray-700 hover:text-green-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
              onClick={handleSuperAdminClick}
            >
              <span className="text-sm">Super Admin Login</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Login Instructions - collapsed by default to keep the card compact */}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowInstructions((v) => !v)}
              aria-expanded={showInstructions}
              className="w-full flex items-center gap-2.5 text-left rounded-xl px-3 py-2.5 bg-white/60 ring-1 ring-gray-200 hover:bg-white transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <Info className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-gray-900 leading-tight">Login Instructions</span>
                <span className="block text-xs text-gray-500">ലോഗിൻ നിർദ്ദേശങ്ങൾ</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                  showInstructions ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                showInstructions ? 'max-h-80 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
              }`}
            >
            <div className="space-y-3 px-3">
              {[
                {
                  en: 'Area admins: use the username issued for your area',
                  ml: 'ഏരിയ അഡ്മിൻ: നിങ്ങളുടെ ഏരിയക്ക് നൽകിയ യൂസർനെയിം ഉപയോഗിക്കുക',
                },
                {
                  en: 'Other admins: use your registered 10-digit mobile number',
                  ml: 'മറ്റ് അഡ്മിൻമാർ: രജിസ്റ്റർ ചെയ്ത 10 അക്ക മൊബൈൽ നമ്പർ ഉപയോഗിക്കുക',
                },
                {
                  en: 'Forgot your password? Contact the state office.',
                  ml: 'പാസ്‌വേഡ് മറന്നോ? സംസ്ഥാന ഓഫീസുമായി ബന്ധപ്പെടുക.',
                },
              ].map(({ en, ml }) => (
                <div key={en} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <p className="text-gray-700 text-xs mb-0.5">{en}</p>
                    <p className="text-xs text-gray-500">{ml}</p>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
