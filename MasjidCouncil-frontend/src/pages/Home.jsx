import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Mail, ShieldCheck, X, ArrowRight, Landmark, Building2, Layers, BadgeCheck, PieChart } from 'lucide-react';
import bannerBg from '../assets/banner3-De89_Ox0.webp';
import dxLogo from '../assets/dx-logo-sml2.webp';
import footerLogo from '../assets/mc-logo2.webp';
import bgPattern from '../assets/bg.webp';
import aboutUsImage from '../assets/inside.webp';
import trackBg from '../assets/btm-bg.webp';
import affiliationIcon from '../assets/mosque.webp';
import welfareIcon from '../assets/moududi2.webp';
import mosqueFundIcon from '../assets/investment.webp';
import { useNavigate, Link } from 'react-router-dom';
import PublicationsSection from '../components/PublicationsSection';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const applications = [
  {
    title: 'Masjid Affiliation',
    malayalam: 'മസ്ജിദ് അഫിലിയേഷൻ',
    description: 'Apply for masjid affiliation with Masjid Council Kerala.',
    icon: affiliationIcon,
  },
  {
    title: 'Imam Muaddin Welfare Fund',
    malayalam: 'ഇമാം മുഅദ്ദിൻ ക്ഷേമനിധി',
    description: 'Apply for welfare assistance for masjid staff.',
    icon: welfareIcon,
  },
  {
    title: 'Masjid Fund',
    malayalam: 'മസ്ജിദ് ഫണ്ട്',
    description: 'Apply for financial assistance for masjid maintenance and repairs.',
    icon: mosqueFundIcon,
  },
  // ponytail: MIRQATH '26 hidden from the public list; /khateeb-registration route
  // still works. Un-comment to bring the card back.
  // {
  //   title: "MIRQATH '26",
  //   malayalam: 'ഖത്തീബ് സംഗമം രജിസ്ട്രേഷൻ',
  //   description: 'Register for the state khateeb meet.',
  //   icon: CalendarDays,
  // },
];

// Reach at a glance — the total is the emphasised cell, so it carries the ivory accent.
const stats = [
  { value: '550', label: 'ജുമാമസ്ജിദുകൾ', icon: Landmark },
  { value: '161', label: 'നമസ്കാര പള്ളികൾ', icon: Building2 },
  { value: '711', label: 'ആകെ', icon: Layers, accent: '#F8F3D8' },
  { value: '62', label: 'സമ്പൂർണ്ണ മഹല്ലുകൾ', icon: BadgeCheck },
  { value: '200', label: 'ഭാഗിക മഹല്ല്', icon: PieChart },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [referenceNumber, setReferenceNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [results, setResults] = useState(null);

  const clearTracking = () => {
    setReferenceNumber('');
    setResults(null);
    setErrorMessage('');
    document.getElementById('reference')?.focus();
  };

  const handleTrackStatus = async () => {
    const q = referenceNumber.trim();
    if (!q) {
      setErrorMessage('Please enter a reference number or mobile number');
      setResults(null);
      return;
    }
    setErrorMessage('');
    setTracking(true);
    setResults(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/track?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        if (data.data.length === 0) {
          setErrorMessage('No application found for that reference or mobile number.');
        }
      } else {
        setErrorMessage(data.message || 'Lookup failed. Please try again.');
      }
    } catch {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setTracking(false);
    }
  };



  const handleNavigation = (title) => {
    if (title === 'Masjid Affiliation') {
      navigate('/affiliation');
    } else if (title === 'Imam Muaddin Welfare Fund') {
      navigate('/medical-aid');
    } else if (title === 'Masjid Fund') {
      navigate('/mosque-fund');
    } else if (title.startsWith("MIRQATH '26")) {
      navigate('/khateeb-registration');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTrackStatus();
    }
  };

  useEffect(() => {
    // Trigger image animation after component mounts
    const timer = setTimeout(() => {
      setIsImageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {/* Hero — banner3-De89_Ox0.webp carries the mosque, green wash and the bottom wave.
          Shown at full size (no crop) from sm up; text scales in vw so it keeps
          its position on the banner at every width. */}
      {/* ponytail: from sm up the box uses the banner's own 1751x898 aspect, so
          object-cover becomes an exact fit — no top/bottom crop at any width and
          the vw-scaled text stays glued to the same spot on the artwork. Mobile
          keeps a fixed height (aspect box would be too short for the text). */}
      <div id="home-section" className="relative bg-[#186b3a] h-[440px] sm:h-auto sm:aspect-[1751/898] overflow-hidden">
        <img
          src={bannerBg}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover object-[62%_center] transition-opacity duration-700 ease-out ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Text sits slightly above the optical centre, clear of the wave.
            Height is fixed on the wrapper (not the text) so scaled-up text at
            md/lg never overflows the image and overlaps the section below. */}
        <div className="relative z-10 h-full flex items-center justify-center px-6 pb-[13%] sm:px-10">
          <div className="w-full max-w-[1000px] text-center px-4 py-8 sm:py-10">
            {/* Ayah */}
            <p
              className="mc-hero-in mc-hero-down text-white"
              dir="rtl"
              style={{
                fontFamily: "'Amiri', 'Noto Naskh Arabic', serif",
                // ponytail: vw-based clamp instead of breakpoint steps — the
                // text shrinks continuously with the banner instead of staying
                // oversized between breakpoints on mid-size screens.
                fontSize: 'clamp(18px, 3.1vw, 42px)',
                lineHeight: 1.8,
                textShadow: '0 2px 10px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)',
              }}
            >
              وَأَنَّ الْمَسَاجِدَ لِلَّهِ فَلَا تَدْعُوا مَعَ اللَّهِ أَحَدًا
            </p>

            {/* Translation */}
            <p
              className="mc-hero-in mc-hero-fade mx-auto mt-3 sm:mt-4 max-w-[640px] italic font-medium leading-relaxed"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(11px, 1.15vw, 15px)',
                color: 'rgba(255,255,255,0.90)',
                animationDelay: '150ms',
              }}
            >
              "And the mosques are for Allah, so do not invoke with Allah anyone."
            </p>

            {/* Reference */}
            <p
              className="mc-hero-in mc-hero-fade mt-2 text-white/70"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(9px, 0.92vw, 12px)', animationDelay: '250ms' }}
            >
              (Surah Al-Jinn : 18)
            </p>

            {/* Malayalam title */}
            <h1
              className="mc-hero-in mc-hero-up mx-auto mt-6 sm:mt-8 max-w-[1000px] font-bold"
              style={{
                fontFamily: "'Noto Sans Malayalam', 'Manjari', sans-serif",
                // ponytail: 2.2vw = the 42px-at-1920 ratio, so the heading keeps
                // the desktop footprint on the artwork at every width instead of
                // ballooning at ~1280 and colliding with the minaret/qubba.
                fontSize: 'clamp(18px, 2.2vw, 42px)',
                color: '#F8F3D8',
                // ponytail: Malayalam glyph ink runs ~1.27x the font size, so a
                // 1.1 line-height made wrapped lines collide on mid-size screens.
                lineHeight: 1.4,
                animationDelay: '350ms',
                // ponytail: pale cream on the sunlit minarets is invisible at
                // widths where the text sits over the mosque; a soft dark
                // shadow keeps every glyph readable without dimming the banner.
                textShadow: '0 2px 12px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)',
              }}
            >
              മസ്ജിദുകൾ മികവിന്റെ കേന്ദ്രങ്ങൾ
            </h1>

            {/* English heading */}
            <p
              className="mc-hero-in mc-hero-up mt-4 sm:mt-5 text-white font-medium"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(13px, 1.4vw, 27px)',
                letterSpacing: '0.5px',
                animationDelay: '550ms',
                textShadow: '0 2px 10px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)',
              }}
            >
              Making Mosques Centers of Excellence
            </p>
          </div>
        </div>
      </div>

      <PublicationsSection />

      <div id="applications-section" className="bg-white py-7 sm:py-10 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-900 text-center mb-6 sm:mb-8 relative leading-tight"
        style={{ fontFamily: "Noto Sans Malayalam" }}
        >
          അപേക്ഷകൾ
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5" style={{ backgroundColor: '#9ece88' }}></div>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {applications.map((app, index) => {
            return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              {/* Circular dark-green icon */}
              <div
                className="w-14 h-14 rounded-full overflow-hidden mb-4 shadow-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6fae44 0%, #3f7f34 55%, #1e5a30 100%)' }}
              >
                <img src={app.icon} alt="" className="w-8 h-8 object-contain" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 leading-snug">{app.title}</h3>
              <p className="text-green-800 text-sm mt-1 mb-3" style={{ fontFamily: "Noto Sans Malayalam" }}>
                {app.malayalam}
              </p>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">{app.description}</p>

              <button
                onClick={() => handleNavigation(app.title)}
                className="mt-auto w-full inline-flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
              >
                Start Application
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            );
          })}
        </div>
      </div>

      {/* About Us Section */}
      <div className="px-4 md:px-8 lg:px-16">
        <div
          id="about-section"
          className="relative rounded-2xl overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `url(${bgPattern})`,
              backgroundSize: 'auto',
              backgroundPosition: 'top left',
              backgroundRepeat: 'repeat'
            }}
          />
          <div className="relative py-8 px-5 sm:py-10 sm:px-8 md:px-12 lg:px-16">
          <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - About Us Image (bottom-aligned so it lines up with the button) */}
            <div className="order-2 lg:order-1 lg:self-center">
              <div className="relative">
                <img
                  src={aboutUsImage}
                  alt="About Masjid Council Kerala"
                  className="w-full h-56 sm:h-72 lg:h-[380px] object-cover rounded-xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
              </div>
            </div>

            {/* Right side - About Us Content */}
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-900 relative pb-2" style={{ fontFamily: "Noto Sans Malayalam" }}>
                മസ്ജിദ് കൗൺസിൽ കേരള
                <div className="absolute bottom-0 left-0 w-20 h-1 rounded-full" style={{ backgroundColor: '#2f6b2f' }}></div>
              </h2>

              <div className="space-y-4 text-black leading-relaxed"
                   style={{ fontFamily: "Noto Sans Malayalam" }}
              >
                <p className="text-sm sm:text-base" style={{ textAlign: 'justify', overflowWrap: 'break-word', wordBreak: 'break-all', fontSize: '15px' }}>
                  മസ്ജിദുകളെ മികവിൻ്റെ കേന്ദ്രങ്ങളാക്കുക എന്ന ലക്ഷ്യത്തോടെ 1990-ൽ സ്ഥാപിതമായ സംവിധാനമാണ് മസ്ജിദ് കൗൺസിൽ കേരള.
                </p>

                <p className="text-sm sm:text-base" style={{ textAlign: 'justify', overflowWrap: 'break-word', wordBreak: 'break-all', fontSize: '15px' }}>
                  മസ്ജിദുകളുടെയും മഹല്ലുകളുടെയും പ്രവർത്തനങ്ങൾക്ക് മേൽനോട്ടം വഹിക്കുകയും ആവശ്യമായ മാർഗ്ഗനിർദ്ദേശങ്ങൾ നൽകുകയും ചെയ്യുക, ഖുത്ബയും ഇമാമത്തും നിർവ്വഹിക്കുവാൻ പ്രാപ്തരായ വ്യക്തികളെ കണ്ടെത്തി പരിശീലനം നൽകുക, നിലവിൽ മസ്ജിദുകളിൽ സേവനം ചെയ്തുവരുന്ന ഖത്വീബുമാരെയും ഇമാമുമാരെയും ശാക്തീകരിക്കുന്നതിനാവശ്യമായ പദ്ധതികൾ നടപ്പിലാക്കുക, മസ്ജിദ്, മഹല്ല് കമ്മിറ്റി ഭാരവാഹികൾക്ക് ആവശ്യമായ പരിശീലന പരിപാടികൾ സംഘടിപ്പിക്കുക തുടങ്ങിയ സുപ്രധാന ഉദ്ദേശ്യ ലക്ഷ്യങ്ങളോടെയാണ് മസ്ജിദ് കൗൺസിൽ കേരള പ്രവർത്തിക്കുന്നത്.
                </p>

                <p className="text-sm sm:text-base" style={{ textAlign: 'justify', overflowWrap: 'break-word', wordBreak: 'break-all', fontSize: '15px' }}>
                  കൂടാതെ ഖത്വീബുമാർക്ക് ഖുത്ബ നിർവ്വഹിക്കുന്നതിന് സഹായകമാകും വിധം വിവിധ വിഷയങ്ങളിൽ സിനോപ്സിസുകൾ തയ്യാറാക്കി നൽകുകയും ചെയ്യുന്നുണ്ട്.
                </p>
              </div>

              {/* Know More Button */}
              <div className="pt-6">
                <button
                  onClick={() => navigate('/about')}
                  className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Know More About Us
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>

      {/* Reach at a glance */}
      <div className="px-4 pt-6 sm:pt-8">
        <div
          className="max-w-6xl mx-auto rounded-2xl sm:rounded-3xl px-3 py-4 sm:px-6 sm:py-8 shadow-lg"
          style={{ background: 'linear-gradient(100deg, #78b247 0%, #4a8a3d 30%, #2f6b2f 65%, #17532b 100%)' }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-3 sm:gap-y-7">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`flex items-center gap-2 sm:gap-4 px-1 sm:px-2 sm:justify-center ${
                    index > 0 ? 'lg:border-l lg:border-white/25' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white/85 shrink-0" strokeWidth={1.25} />
                  {/* Number and label share a line on phones, stack from sm up */}
                  <div className="min-w-0 flex items-baseline gap-1.5 sm:block text-left">
                    <p
                      className="text-[15px] sm:text-2xl font-bold leading-none"
                      style={{ color: stat.accent || '#ffffff' }}
                    >
                      {stat.value}
                    </p>
                    <p
                      className="text-[10px] sm:text-xs sm:mt-1.5 text-green-100 leading-snug truncate sm:whitespace-normal"
                      style={{ fontFamily: 'Noto Sans Malayalam' }}
                    >
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-7 sm:py-9">
        <div
          // ponytail: capped at the artwork's native 1321px so the strip is
          // never upscaled — wider than this and the mosques go soft.
          className="relative w-full max-w-[1280px] mx-auto rounded-3xl overflow-hidden shadow-lg"
          style={{
            // ponytail: btm-bg is a wide strip (~5.8:1); `cover` would crop the
            // mosques off both edges, so pin it full-width at the bottom and let
            // its own pale-mint top blend into the matching backgroundColor.
            backgroundColor: '#eef4ec',
            backgroundImage: `url(${trackBg})`,
            backgroundSize: '100% auto',
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="relative px-5 pt-6 pb-8 sm:px-10 sm:pt-7 sm:pb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-green-900 text-center">
              Track Your Application
            </h2>
            <p className="mt-1.5 text-center text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
              Enter your application reference number or the mobile number used during registration
            </p>

            <div className="mt-5 max-w-2xl mx-auto space-y-3 bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="reference" className="sr-only">
              Reference Number or Mobile Number
            </label>

            <div className="relative flex-1">
              <input
                type="text"
                id="reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter reference number or mobile number"
                className={`w-full px-4 py-3 ${referenceNumber ? 'pr-11' : ''} border ${
                  errorMessage ? 'border-red-500' : 'border-gray-300'
                } h-12 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 text-gray-900 placeholder-gray-500 outline-none text-sm sm:text-base`}
              />
              {referenceNumber && (
                <button
                  type="button"
                  onClick={clearTracking}
                  aria-label="Clear and track another"
                  title="Track another"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={handleTrackStatus}
              disabled={tracking}
              className="h-12 shrink-0 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm sm:text-base font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-700/30"
            >
              <Search className={`h-5 w-5 ${tracking ? 'animate-pulse' : ''}`} />
              {tracking ? 'Searching…' : 'Track Status'}
            </button>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          {results && results.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100" style={{ animation: 'mc-modal-in .25s ease-out' }}>
              {results.map((r, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900 text-sm truncate">{r.name || 'Application'}</p>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize flex-shrink-0 ${
                      r.status === 'approved' ? 'bg-[#EAF6EF] text-[#1F6B3A] border border-green-200'
                      : r.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>{r.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {r.type}
                    {r.reference ? ` · ${r.reference}` : ''}
                    {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString('en-GB')}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

          <div id="contact-section" className="relative" style={{ backgroundColor: '#477d33' }}>
        {/* Dark green line at bottom */}
        <div className="h-3 w-full absolute bottom-0 left-0" style={{ backgroundColor: '#304e26' }}></div>

        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {/* Brand */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="w-12 h-12 lg:w-20 lg:h-20">
                <img src={footerLogo} alt="Masjid Council Kerala" className="object-contain w-full h-full" />
              </div>
              <p className="text-green-100/90 text-[11px] lg:text-xs leading-relaxed max-w-xs mt-2 lg:mt-3">
                Working for the development of mosques and the welfare of the Muslim community across Kerala.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-2 lg:space-y-3 flex flex-col items-center sm:items-start text-center sm:text-left">
              <h3 className="text-sm lg:text-base font-semibold text-white">Quick Links</h3>
              <ul className="space-y-1.5">
                <li>
                  <Link to="/" className="text-green-100 text-[13px] hover:text-white transition">Home</Link>
                </li>
                <li>
                  <a href="/#applications-section" className="text-green-100 text-[13px] hover:text-white transition">Applications</a>
                </li>
                <li>
                  <Link to="/about" className="text-green-100 text-[13px] hover:text-white transition">About Us</Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="text-green-100 text-[13px] hover:text-white transition">Privacy Policy</Link>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="space-y-2 lg:space-y-3">
              <h3 className="text-sm lg:text-base font-semibold text-white">Contact Us</h3>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-green-100 text-[13px] leading-snug">
                    Masjid Council Kerala,<br />
                    Hira Centre, PB No. 833,<br />
                    Mavoor Road, Kozhikode - 4,<br />
                    673004
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <a
                    href="tel:+919562478805"
                    className="text-green-100 text-[13px] hover:text-white transition"
                  >
                    +91 95624 78805
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <a
                    href="mailto:masjidcouncilkerala@gmail.com"
                    className="text-green-100 text-[13px] hover:text-white transition break-all"
                  >
                    masjidcouncilkerala@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Map — dropped on phones, it dominates the screen for little value */}
            <div className="hidden lg:block">
              <h3 className="text-base font-semibold text-white mb-4">Find Us</h3>
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg w-full max-w-[300px] h-[180px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3913.0048853421154!2d75.7886534!3d11.2610504!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTHCsDE1JzM5LjgiTiA3NcKwNDcnMTkuMiJF!5e0!3m2!1sen!2sbh!4v1748684741914!5m2!1sen!2sbh"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Masjid Council Kerala Location"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-4 lg:mt-8 pt-3 lg:pt-4 border-t border-white/15 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-2">
            <p className="flex items-center gap-2 text-green-100 text-[11px] lg:text-xs text-center">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              © {new Date().getFullYear()} Masjid Council Kerala. All Rights Reserved.
            </p>
            <a
              href="https://www.d4dx.co"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-green-100 text-xs hover:text-white transition"
            >
              Powered by
              <img src={dxLogo} alt="D4DX Innovations LLP" className="h-6 w-auto shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;