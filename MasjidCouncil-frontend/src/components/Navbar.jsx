
import React, { useState, useEffect } from 'react';
import { LogIn, Menu, X, FileText, Info, Phone, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom'; // for navigation
import logo from '../assets/logo.png';

const navFont = {
  fontFamily: "'Poppins', sans-serif"
};

const Navbar = () => {
  const navigate = useNavigate(); // initialize navigation
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLoginClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/admin-login'); // redirect to /admin-login route
  };

  const handleFormClick = () => {
    setIsMobileMenuOpen(false);
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
    setIsMobileMenuOpen(false);
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
    setIsMobileMenuOpen(false);
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
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between gap-2 py-3 md:py-6">
            {/* Logo and Text */}
            <Link to="/" aria-label="Go to home" className="flex items-center">
              <img src={logo} alt="Masjid Council Kerala" className="h-12 w-auto md:h-14 shrink-0" />
            </Link>

            {/* Center Navigation Buttons - desktop only, pushed toward the right */}
            <div className="hidden md:flex items-center md:space-x-8 min-w-0 md:ml-auto md:mr-3">
              <button
                onClick={handleFormClick}
                className="text-black md:text-lg font-medium tracking-wide hover:text-green-600 transition-all duration-300 hover:scale-105 whitespace-nowrap"
                style={navFont}
              >
                Applications
              </button>
              <button
                onClick={handleAboutClick}
                className="text-black md:text-lg font-medium tracking-wide hover:text-green-600 transition-all duration-300 hover:scale-105 whitespace-nowrap"
                style={navFont}
              >
                About
              </button>
              <button
                onClick={handleContactClick}
                className="text-black md:text-lg font-medium tracking-wide hover:text-green-600 transition-all duration-300 hover:scale-105 whitespace-nowrap"
                style={navFont}
              >
                Contact
              </button>
            </div>

            {/* Admin Login Button - Icon Only (desktop; on mobile it lives in the menu) */}
            <button
              onClick={handleLoginClick}
              className="hidden md:flex items-center justify-center shrink-0 md:w-12 md:h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 group"
              title="Admin Login"
            >
              <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </button>

            {/* Mobile: hamburger toggle */}
            <button
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="flex md:hidden items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-green-50 text-green-700 active:scale-95 transition-all duration-200"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="relative w-5 h-5">
                <Menu
                  className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
                  }`}
                />
                <X
                  className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-3 pb-3 pt-1 flex flex-col gap-1" style={navFont}>
            {[
              { label: 'Applications', icon: FileText, onClick: handleFormClick },
              { label: 'About', icon: Info, onClick: handleAboutClick },
              { label: 'Contact', icon: Phone, onClick: handleContactClick },
            ].map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left text-gray-800 font-semibold hover:bg-green-50 active:bg-green-100 transition-colors duration-200"
              >
                <span className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                {label}
                <ChevronRight className="ml-auto w-4 h-4 text-gray-300" />
              </button>
            ))}
            <button
              onClick={handleLoginClick}
              className="mt-1 flex items-center justify-center gap-2 w-full rounded-xl px-3 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-md active:scale-[0.98] transition-transform duration-200"
            >
              <LogIn className="w-[18px] h-[18px]" />
              Admin Login
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop - tap to close */}
      <div
        onClick={() => setIsMobileMenuOpen(false)}
        className={`md:hidden fixed inset-0 -z-10 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
    </header>
  );
};

export default Navbar;
