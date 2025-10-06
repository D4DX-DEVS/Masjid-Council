import React, { useState, useEffect } from 'react';
import { LogIn, Building2, UserRound, Search, MapPin, Phone, Mail, Home } from 'lucide-react';
import masjidBg from '../assets/masjid.png';
import logo from '../assets/logo.png';
import dxLogoWhite from '../assets/dxLogoWhite.png';
import bgPattern from '../assets/bg.png';
import aboutUsImage from '../assets/About Us Image.jpg';
import { useNavigate } from 'react-router-dom';


const applications = [
  {
    title: 'Masjid Affiliation',
    malayalam: 'മസ്ജിദ് അഫിലിയേഷൻ',
    description: 'Apply for masjid affiliation with Masjid Council Kerala',
    icon: <Home className="w-5 h-5 text-white" />,
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
      <div className="px-4 py-8 md:px-8 lg:px-16">
        <div
          className={`relative h-96 md:h-[600px] bg-cover bg-center rounded-xl overflow-hidden shadow-2xl mx-auto max-w-7xl transition-all duration-1000 ease-out ${
              isImageLoaded 
                ? 'translate-y-0 opacity-100' 
              : 'translate-y-8 opacity-0'
          }`}
          style={{
            backgroundImage: `url(${masjidBg})`,
          }}
        ></div>
      </div>

      <div id="applications-section" className="bg-white py-16 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-green-900 text-center mb-12 relative"
        style={{ fontFamily: "Anek Malayalam Variable" }}
        >
          അപേക്ഷകൾ
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5" style={{ backgroundColor: '#9ece88' }}></div>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {applications.map((app, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between transition hover:shadow-xl"
            >
              <div>
                {/* Title and Icon in the same row */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${app.bgColor}`}>
                    {app.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{app.title}</h3>
                </div>
                
                <p className="text-gray-600 text-sm mb-2" 
        style={{ fontFamily: "Anek Malayalam Variable" }}
                
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
          className="py-16 px-8 md:px-12 lg:px-16 relative rounded-2xl"
          style={{
            backgroundImage: `url(${bgPattern})`,
            backgroundSize: 'auto',
            backgroundPosition: 'top left',
            backgroundRepeat: 'repeat'
          }}
        >
          <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - About Us Image */}
            <div className="order-2 lg:order-1">
              <div className="relative">
                <img 
                  src={aboutUsImage} 
                  alt="About Masjid Council Kerala" 
                  className="w-full h-96 lg:h-[500px] object-cover rounded-xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
              </div>
            </div>

            {/* Right side - About Us Content */}
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-green-900 relative"
                  style={{ fontFamily: "Anek Malayalam Variable" }}
              >
                About Us
                <div className="absolute bottom-0 left-0 w-24 h-0.5" style={{ backgroundColor: '#9ece88' }}></div>
              </h2>
              
              <div className="space-y-4 text-black leading-relaxed"
                   style={{ fontFamily: "Anek Malayalam Variable" }}
              >
                <p className="text-base">
                  മസ്ജിദുകളെ മികവിൻ്റെ കേന്ദ്രങ്ങളാക്കുക എന്ന ലക്ഷ്യത്തോടെ 1990-ൽ സ്ഥാപിതമായ സംവിധാനമാണ് മസ്ജിദ് കൗൺസിൽ കേരള.
                </p>
                
                <p className="text-base">
                  മസ്ജിദുകളുടെയും മഹല്ലുകളുടെയും പ്രവർത്തനങ്ങൾക്ക് മേൽനോട്ടം വഹിക്കുകയും ആവശ്യമായ മാർഗ്ഗനിർദ്ദേശങ്ങൾ നൽകുകയും ചെയ്യുക, ഖുത്ബയും ഇമാമത്തും നിർവ്വഹിക്കുവാൻ പ്രാപ്തരായ വ്യക്തികളെ കണ്ടെത്തി പരിശീലനം നൽകുക, നിലവിൽ മസ്ജിദുകളിൽ സേവനം ചെയ്തുവരുന്ന ഖത്വീബുമാരെയും ഇമാമുമാരെയും ശാക്തീകരിക്കുന്നതിനാവശ്യമായ പദ്ധതികൾ നടപ്പിലാക്കുക, മസ്ജിദ്, മഹല്ല് കമ്മിറ്റി ഭാരവാഹികൾക്ക് ആവശ്യമായ പരിശീലന പരിപാടികൾ സംഘടിപ്പിക്കുക തുടങ്ങിയ സുപ്രധാന ഉദ്ദേശ്യ ലക്ഷ്യങ്ങളോടെയാണ് മസ്ജിദ് കൗൺസിൽ കേരള പ്രവർത്തിക്കുന്നത്.
                </p>
                
                <p className="text-base">
                  കൂടാതെ ഖത്വീബുമാർക്ക് ഖുത്ബ നിർവ്വഹിക്കുന്നതിന് സഹായകമാകും വിധം വിവിധ വിഷയങ്ങളിൽ സിനോപ്സിസുകൾ തയ്യാറാക്കി നൽകുകയും ചെയ്യുന്നുണ്ട്.
                </p>
              </div>
              
              {/* Learn More Button */}
              <div className="pt-6">
                <button
                  onClick={() => navigate('/about')}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  style={{ fontFamily: "Anek Malayalam Variable" }}
                >
                  കൂടുതൽ അറിയുക
                </button>
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
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
            {/* Left side - Masjid Council Logo (bigger) */}
            <div className="flex flex-col items-center lg:items-start space-y-6 pr-8 pl-4">
              <div className="w-32 h-32 lg:w-40 lg:h-40">
                <img src={logo} alt="Masjid Council Kerala" className="object-contain w-full h-full" />
              </div>
              
              {/* D4DX Logo (smaller) */}
              <div className="flex flex-col items-center lg:items-start space-y-2">
                <div className="w-16 h-10">
                  <img src={dxLogoWhite} alt="D4DX" className="object-contain w-full h-full" />
                </div>
                <p className="text-green-100 text-sm font-medium text-center lg:text-left">
                  © POWERED BY D4DX INNOVATIONS LLP
                </p>
              </div>
          </div>
            
            {/* Right side - Contact Information */}
            <div className="space-y-6 pl-2 pr-4">
              <div className="flex items-start space-x-4">
                <MapPin className="h-6 w-6 text-white mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-white">Address</h3>
                  <p className="text-green-100 text-sm leading-relaxed">
                    Hira Centre, Mavoor Road<br />
                    Kozhikode - 673001
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Phone className="h-6 w-6 text-white mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-white">Phone</h3>
                  <a
                    href="tel:+914952720101"
                    className="text-green-100 text-sm hover:text-white transition"
                  >
                    +91 495 2720 101
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Mail className="h-6 w-6 text-white mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-white">Email</h3>
                  <a
                    href="mailto:info@masjidcouncilkerala.org"
                    className="text-green-100 text-sm hover:text-white transition"
                  >
                    info@masjidcouncilkerala.org
                  </a>
                </div>
              </div>
            </div>
            
            {/* Right side - Map */}
            <div className="w-full max-w-md mx-auto lg:mx-0 pl-2 pr-4">
              <div className="bg-white rounded-lg overflow-hidden shadow-lg h-64 lg:h-80">
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
        </div>
      </div>
    </div>
  );
};

export default HeroSection;