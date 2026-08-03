import React, { useState, useEffect } from 'react';
import { LogIn, Building2, UserRound, Search, MapPin, Phone, Mail, CalendarDays, ShieldCheck } from 'lucide-react';
import masjidBg from '../assets/masjid.png';
import dxLogo from '../assets/dx-logo-sml.png';
import logo from '../assets/logo.png';
import bgPattern from '../assets/bg.png';
import aboutUsImage from '../assets/About Us Image.jpg';
import { useNavigate } from 'react-router-dom';


const applications = [
  {
    title: 'Masjid Affiliation',
    malayalam: 'മസ്ജിദ് അഫിലിയേഷൻ',
    description: 'Apply for masjid affiliation with Masjid Council Kerala',
    icon: <img src="/mosque.svg" alt="" className="w-6 h-6" />,
    bgColor: 'bg-[#8cbb58]',
  },
  {
    title: 'Imam Muaddin Welfare Fund',
    malayalam: 'ഇമാം മുഅദ്ദിൻ ക്ഷേമനിധി',
    description: 'Apply for welfare assistance for masjid staff',
    icon: <UserRound className="w-5 h-5 text-white" />,
    bgColor: 'bg-[#8cbb58]',
  },
  {
    title: 'Masjid Fund',
    malayalam: 'മസ്ജിദ് ഫണ്ട്',
    description: 'Apply for financial assistance for masjid maintenance and repairs',
    icon: <Building2 className="w-5 h-5 text-white" />,
    bgColor: 'bg-[#8cbb58]',
  },
  {
    title: "MIRQATH '26",
    malayalam: 'ഖത്തീബ് സംഗമം രജിസ്ട്രേഷൻ',
    description: 'Register for the state khateeb meet',
    icon: <CalendarDays className="w-5 h-5 text-white" />,
    bgColor: 'bg-[#8cbb58]',
  },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [referenceNumber, setReferenceNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleTrackStatus = () => {
    if (referenceNumber.trim()) {
      setErrorMessage('');
      console.log('Tracking application for:', referenceNumber);
      // Navigate or call API here
    } else {
      setErrorMessage('Please enter a reference number or mobile number');
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
      <div className="px-4 py-4 sm:py-6 md:px-8 md:py-8 lg:px-16">
        {/* Same 16px side padding as the application cards below, so both edges line up */}
        <img
          src={masjidBg}
          alt="Masjid Council Kerala"
          className={`block w-full h-auto md:h-[600px] md:object-cover rounded-xl shadow-lg sm:shadow-2xl mx-auto max-w-7xl transition-all duration-1000 ease-out ${
            isImageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        />
      </div>

      <div id="applications-section" className="bg-white py-10 sm:py-16 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-900 text-center mb-8 sm:mb-12 relative leading-tight"
        style={{ fontFamily: "Noto Sans Malayalam" }}
        >
          അപേക്ഷകൾ
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5" style={{ backgroundColor: '#9ece88' }}></div>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
          {applications.map((app, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col justify-between transition hover:shadow-xl"
            >
              <div>
                {/* Title and Icon in the same row */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 shrink-0 rounded-md flex items-center justify-center ${app.bgColor}`}>
                    {app.icon}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">{app.title}</h3>
                </div>
                
                <p className="text-gray-600 text-sm mb-2" 
        style={{ fontFamily: "Noto Sans Malayalam" }}
                
                >{app.malayalam}</p>
                <p className="text-sm text-gray-500 mb-6">{app.description}</p>
              </div>
              <button
                onClick={() => handleNavigation(app.title)}
                className="mt-auto bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Start Application
              </button>
            </div>
          ))}
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
          <div className="relative py-10 px-5 sm:py-16 sm:px-8 md:px-12 lg:px-16">
          <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - About Us Image (bottom-aligned so it lines up with the button) */}
            <div className="order-2 lg:order-1 lg:self-end">
              <div className="relative">
                <img
                  src={aboutUsImage}
                  alt="About Masjid Council Kerala"
                  className="w-full h-56 sm:h-80 lg:h-[500px] object-cover rounded-xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
              </div>
            </div>

            {/* Right side - About Us Content */}
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-900 relative"
                  style={{ fontFamily: "Noto Sans Malayalam" }}
              >
                About Us
                <div className="absolute bottom-0 left-0 w-24 h-0.5" style={{ backgroundColor: '#9ece88' }}></div>
              </h2>
              
              <div className="space-y-4 text-black leading-relaxed"
                   style={{ fontFamily: "Noto Sans Malayalam" }}
              >
                <p className="text-sm sm:text-base">
                  മസ്ജിദുകളെ മികവിൻ്റെ കേന്ദ്രങ്ങളാക്കുക എന്ന ലക്ഷ്യത്തോടെ 1990-ൽ സ്ഥാപിതമായ സംവിധാനമാണ് മസ്ജിദ് കൗൺസിൽ കേരള.
                </p>
                
                <p className="text-sm sm:text-base">
                  മസ്ജിദുകളുടെയും മഹല്ലുകളുടെയും പ്രവർത്തനങ്ങൾക്ക് മേൽനോട്ടം വഹിക്കുകയും ആവശ്യമായ മാർഗ്ഗനിർദ്ദേശങ്ങൾ നൽകുകയും ചെയ്യുക, ഖുത്ബയും ഇമാമത്തും നിർവ്വഹിക്കുവാൻ പ്രാപ്തരായ വ്യക്തികളെ കണ്ടെത്തി പരിശീലനം നൽകുക, നിലവിൽ മസ്ജിദുകളിൽ സേവനം ചെയ്തുവരുന്ന ഖത്വീബുമാരെയും ഇമാമുമാരെയും ശാക്തീകരിക്കുന്നതിനാവശ്യമായ പദ്ധതികൾ നടപ്പിലാക്കുക, മസ്ജിദ്, മഹല്ല് കമ്മിറ്റി ഭാരവാഹികൾക്ക് ആവശ്യമായ പരിശീലന പരിപാടികൾ സംഘടിപ്പിക്കുക തുടങ്ങിയ സുപ്രധാന ഉദ്ദേശ്യ ലക്ഷ്യങ്ങളോടെയാണ് മസ്ജിദ് കൗൺസിൽ കേരള പ്രവർത്തിക്കുന്നത്.
                </p>
                
                <p className="text-sm sm:text-base">
                  കൂടാതെ ഖത്വീബുമാർക്ക് ഖുത്ബ നിർവ്വഹിക്കുന്നതിന് സഹായകമാകും വിധം വിവിധ വിഷയങ്ങളിൽ സിനോപ്സിസുകൾ തയ്യാറാക്കി നൽകുകയും ചെയ്യുന്നുണ്ട്.
                </p>
              </div>
              
              {/* Learn More Button */}
              <div className="pt-6">
                <button
                  onClick={() => navigate('/about')}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  style={{ fontFamily: "Noto Sans Malayalam" }}
                >
                  കൂടുതൽ അറിയുക
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-10 max-w-xl mx-auto">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="reference"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Reference Number or Mobile Number
            </label>

            <input
              type="text"
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter reference number or mobile number"
              className={`w-full px-4 py-3 border ${
                errorMessage ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 text-gray-900 placeholder-gray-500 outline-none text-sm sm:text-base`}
            />

            {errorMessage && (
              <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
            )}
          </div>

          <button
            onClick={handleTrackStatus}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2 outline-none text-sm sm:text-base"
          >
            <Search className="h-5 w-5" />
            <span>Track Status</span>
          </button>
        </div>

        <div className="mt-6 text-center px-2">
          <p className="text-xs sm:text-sm text-gray-500">
            Enter your application reference number or the mobile number used during registration
          </p>
        </div>
      </div>

          <div id="contact-section" className="relative" style={{ backgroundColor: '#477d33' }}>
        {/* Dark green line at bottom */}
        <div className="h-3 w-full absolute bottom-0 left-0" style={{ backgroundColor: '#304e26' }}></div>

        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-10 items-center">
            {/* Logo */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="w-16 h-16 lg:w-24 lg:h-24">
                <img src={logo} alt="Masjid Council Kerala" className="object-contain w-full h-full" />
              </div>
              <p className="hidden lg:block text-green-100/90 text-xs leading-relaxed max-w-xs mt-3">
                Working for the development of mosques and the welfare of the Muslim community across Kerala.
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-2.5 lg:space-y-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2 lg:block">
                  <h3 className="text-sm font-semibold text-white">Address</h3>
                  <p className="text-green-100 text-[13px] leading-snug">
                    Hira Centre, Mavoor Road, Kozhikode - 673001
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2 lg:block">
                  <h3 className="text-sm font-semibold text-white">Phone</h3>
                  <a
                    href="tel:+914952720101"
                    className="text-green-100 text-[13px] hover:text-white transition"
                  >
                    +91 495 2720 101
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2 lg:block">
                  <h3 className="text-sm font-semibold text-white">Email</h3>
                  <a
                    href="mailto:info@masjidcouncilkerala.org"
                    className="text-green-100 text-[13px] hover:text-white transition break-all"
                  >
                    info@masjidcouncilkerala.org
                  </a>
                </div>
              </div>
            </div>

            {/* Map (desktop only) */}
            <div className="hidden lg:flex lg:items-center lg:justify-end">
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
          <div className="mt-5 lg:mt-8 pt-4 border-t border-white/15 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-2">
            <p className="flex items-center gap-2 text-green-100 text-xs text-center">
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
              {/* ponytail: white pill — the logo is dark navy and would vanish on the green footer */}
              <img src={dxLogo} alt="D4DX Innovations LLP" className="h-6 w-auto shrink-0 bg-white rounded px-1.5 py-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;