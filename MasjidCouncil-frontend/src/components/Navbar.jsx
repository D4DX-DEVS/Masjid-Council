import React, { useState, useEffect } from 'react';
import { LogIn, Menu, X, Home as HomeIcon, FileText, Info, Phone, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // for navigation
import logo from '../assets/logo.webp';

const navFont = {
  fontFamily: "'Poppins', sans-serif"
};

// ponytail: id order matches top-to-bottom section order on Home for scroll-spy.
const SECTION_IDS = ['home-section', 'applications-section', 'about-section', 'contact-section'];

const Navbar = () => {
  const navigate = useNavigate(); // initialize navigation
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home-section');

  // Shrink header + logo once the page scrolls past the top.
  // ponytail: hysteresis band (shrink at 72, grow back at 16). A single
  // threshold jitters — shrinking the sticky bar pulls the page up, which can
  // drop scrollY back under the threshold, which grows it again, and so on.
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled((wasScrolled) => (wasScrolled ? window.scrollY > 16 : window.scrollY > 72));
      // ponytail: contact-section is the last element on the page, so it can
      // never fill the observer's mid-viewport band once scrolling bottoms
      // out — force it active at the bottom instead of relying on that band.
      if (window.location.pathname === '/') {
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (atBottom) setActiveSection('contact-section');
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the nav item for whichever Home section is in view.
  useEffect(() => {
    if (location.pathname !== '/') return undefined;
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[visible.length - 1].target.id);
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [location.pathname]);

  const isActive = (sectionId) => location.pathname === '/' && activeSection === sectionId;
  const navLinkClass = (active) =>
    `md:text-base font-medium tracking-wide transition-all duration-300 hover:text-green-600 hover:scale-105 whitespace-nowrap ${
      active ? 'text-green-600' : 'text-black'
    }`;

  const handleHomeClick = () => {
    setIsMobileMenuOpen(false);
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

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

  return (
    // ponytail: sticky (not fixed) keeps the bar always visible without needing
    // per-page top padding to offset it.
    <header className="sticky top-0 left-0 right-0 z-50">
      {/* Top green gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#239a5a] via-[#6db14e] to-green-700" />
      {/* Main navbar content - matching hero section alignment */}
      <nav className="bg-white shadow-lg backdrop-blur-sm bg-white/95">
        <div className="px-4 md:px-6">
          <div
            className={`flex items-center justify-between gap-2 transition-all duration-300 ${
              isScrolled ? 'py-1 md:py-1.5' : 'py-2 md:py-3'
            }`}
          >
            {/* Logo and Text */}
            <Link to="/" aria-label="Go to home" className="flex items-center ml-12 md:ml-48">
              <img
                src={logo}
                alt="Masjid Council Kerala"
                className={`w-auto shrink-0 transition-all duration-300 ${
                  isScrolled ? 'h-9 md:h-10' : 'h-12 md:h-16'
                }`}
              />
            </Link>

            {/* Center Navigation Buttons - desktop only, pushed toward the right */}
            <div className="hidden md:flex items-center md:space-x-8 min-w-0 md:ml-auto md:mr-3">
              <button
                onClick={handleHomeClick}
                className={navLinkClass(isActive('home-section'))}
                style={navFont}
              >
                Home
              </button>
              <button
                onClick={handleFormClick}
                className={navLinkClass(isActive('applications-section'))}
                style={navFont}
              >
                Applications
              </button>
              <button
                onClick={handleAboutClick}
                className={navLinkClass(isActive('about-section'))}
                style={navFont}
              >
                About
              </button>
              <button
                onClick={handleContactClick}
                className={navLinkClass(isActive('contact-section'))}
                style={navFont}
              >
                Contact
              </button>
            </div>

            {/* Admin Login Button - Icon Only (desktop; on mobile it lives in the menu) */}
            <button
              onClick={handleLoginClick}
              className="hidden md:flex items-center justify-center shrink-0 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 group"
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
              { label: 'Home', icon: HomeIcon, onClick: handleHomeClick, sectionId: 'home-section' },
              { label: 'Applications', icon: FileText, onClick: handleFormClick, sectionId: 'applications-section' },
              { label: 'About', icon: Info, onClick: handleAboutClick, sectionId: 'about-section' },
              { label: 'Contact', icon: Phone, onClick: handleContactClick, sectionId: 'contact-section' },
            ].map(({ label, icon: Icon, onClick, sectionId }) => (
              <button
                key={label}
                onClick={onClick}
                className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left font-semibold hover:bg-green-50 active:bg-green-100 transition-colors duration-200 ${
                  isActive(sectionId) ? 'text-green-600' : 'text-gray-800'
                }`}
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
