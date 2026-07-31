import React, { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
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
    <div 
      className="min-h-screen flex items-center justify-center p-6 lg:p-8 relative pt-20"
      style={{
        backgroundImage: `url(${loginSuper})`,
        backgroundSize: '40%',
        backgroundPosition: 'left top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#adc5cc'
      }}
    >
      {/* Overlay to reduce image opacity */}
      <div className="absolute inset-0 bg-white/70"></div>
      


      {/* Main Content */}
      <div className="max-w-md w-full relative z-20 ml-180 -mt-24">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Professional Header Section */}
          <div className="flex items-center justify-start mb-10 -ml-20">
            <img 
              src={logo} 
              alt="Masjid Council Kerala" 
              className="h-20 w-auto mr-8"
            />
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'Cinzel, serif' }}>Super Admin Login</h1>
          </div>
          <div>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-80 border-2 border-[#80a6b0] rounded-full px-6 py-3 focus:ring-0 focus:border-[#80a6b0] transition-all duration-300 shadow-sm hover:shadow-md"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-80 border-2 border-[#80a6b0] rounded-full px-6 py-3 pr-14 focus:ring-0 focus:border-[#80a6b0] transition-all duration-300 shadow-sm hover:shadow-md"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-36 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-64 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ml-10"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
      
      {/* Arabic text at bottom */}
      <div className="absolute bottom-6 right-74 text-right mb-12">
        <p className="text-3xl text-gray-700 font-medium" dir="rtl" style={{ fontFamily: 'Amiri, serif' }}>
          وَأَنَّ ٱلْمَسَٰجِدَ لِلَّهِ فَلَا تَدْعُواْ مَعَ ٱللَّهِ أَحَدًا
        </p>
      </div>
    </div>
  );
};

export default SuperAdminLogin;