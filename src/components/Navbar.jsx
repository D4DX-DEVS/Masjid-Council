
import React, { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // for navigation
import logo from '../assets/logo.png';

// Import Cinzel font
const cinzelFont = {
  fontFamily: "'Cinzel', serif"
};

const Navbar = () => {
  const navigate = useNavigate(); // initialize navigation
  const [isVisible, setIsVisible] = useState(false);

  const handleLoginClick = () => {
    navigate('/admin-login'); // redirect to /admin-login route
  };

  const handleFormClick = () => {
    // Check if we're on the About page
    if (window.location.pathname === '/about') {
      // Navigate to home page first, then scroll to form section
      navigate('/');
      setTimeout(() => {
        const formSection = document.getElementById('applications-section');
        if (formSection) {
          const navbarHeight = 80;
          const elementPosition = formSection.offsetTop - navbarHeight;
          window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      // On home page, just scroll to section
      const formSection = document.getElementById('applications-section');
      if (formSection) {
        const navbarHeight = 80;
        const elementPosition = formSection.offsetTop - navbarHeight;
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleAboutClick = () => {
    const aboutSection = document.getElementById('about-section');
    if (aboutSection) {
      const navbarHeight = 80;
      const elementPosition = aboutSection.offsetTop - navbarHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleContactClick = () => {
    // Check if we're on the About page
    if (window.location.pathname === '/about') {
      // Navigate to home page first, then scroll to contact section
      navigate('/');
      setTimeout(() => {
        const contactSection = document.getElementById('contact-section');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // On home page, just scroll to section
      const contactSection = document.getElementById('contact-section');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentPath = window.location.pathname;
      
      // Always show navbar on About page
      if (currentPath === '/about') {
        setIsVisible(true);
        return;
      }
      
      // For other pages (like Home), show navbar after scroll
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollTop > 100);
    };

    // Check initial state
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      {/* Top green gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#239a5a] via-[#6db14e] to-green-700" />
      {/* Main navbar content - matching hero section alignment */}
      <nav className="bg-white shadow-lg backdrop-blur-sm bg-white/95">
        <div className="px-4 md:px-8 lg:px-16">
          <div className="mx-auto max-w-7xl flex items-center justify-between py-6">
            {/* Logo and Text */}
            <div className="flex items-center space-x-3">
              <div className="w-32 h-10 rounded-full flex items-center justify-center">
              <img src={logo} alt="Masjid Council Kerala" className="h-15 w-24" />
              </div>
            </div>

            {/* Center Navigation Buttons */}
            <div className="flex items-center space-x-8">
              <button
                onClick={handleFormClick}
                className="text-black text-lg font-semibold tracking-wide hover:text-green-600 transition-all duration-300 hover:scale-105"
                style={cinzelFont}
              >
                Applications
              </button>
              <button
                onClick={handleAboutClick}
                className="text-black text-lg font-semibold tracking-wide hover:text-green-600 transition-all duration-300 hover:scale-105"
                style={cinzelFont}
              >
                About
              </button>
              <button
                onClick={handleContactClick}
                className="text-black text-lg font-semibold tracking-wide hover:text-green-600 transition-all duration-300 hover:scale-105"
                style={cinzelFont}
              >
                Contact
              </button>
            </div>

            {/* Admin Login Button - Icon Only */}
            <button
              onClick={handleLoginClick}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 group"
              title="Admin Login"
            >
              <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
