import React, { useEffect } from 'react';
import { MapPin, Phone, Mail, Target, Award } from 'lucide-react';
import logo from '../assets/logo.webp';
import mainAboutUs from '../assets/aboutMain.webp';

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${mainAboutUs})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay to reduce image opacity */}
      <div className="absolute inset-0 bg-white/70"></div>
      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-16 relative z-20 max-w-6xl mx-auto">

        <div className="space-y-4 text-black leading-relaxed text-justify bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-black/5 p-6 sm:p-10 lg:p-14"
             style={{ fontFamily: "Noto Sans Malayalam" }}
        >
          <h3 className="text-3xl font-semibold text-green-900 mb-6"
              style={{ fontFamily: 'var(--font-ml-title)' }}
          >
            മസ്ജിദ് കൗൺസിൽ കേരള
          </h3>

          <p className="text-base leading-6 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദുകളെ സമഗ്രമായ മികവിന്റെ കേന്ദ്രങ്ങളാക്കി മാറ്റുക എന്ന ലക്ഷ്യത്തോടെ 1990-ൽ സ്ഥാപിതമായ സംവിധാനമാണ് മസ്ജിദ് കൗൺസിൽ കേരള.
          </p>

          <p className="text-base leading-6 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദുകളുടെയും മഹല്ലുകളുടെയും പ്രവർത്തനങ്ങൾക്ക് മേൽനോട്ടം വഹിക്കുക, ആവശ്യമായ മാർഗനിർദേശങ്ങൾ നൽകുക, ഖുത്ബയും ഇമാമത്തും നിർവഹിക്കാൻ പ്രാപ്തരായ വ്യക്തികളെ കണ്ടെത്തി പരിശീലിപ്പിക്കുക, നിലവിൽ സേവനമനുഷ്ഠിക്കുന്ന ഖത്വീബുമാരെയും ഇമാമുമാരെയും ശാക്തീകരിക്കുക, മസ്ജിദ്–മഹല്ല് കമ്മിറ്റി ഭാരവാഹികൾക്ക് പരിശീലന പരിപാടികൾ സംഘടിപ്പിക്കുക തുടങ്ങിയ സുപ്രധാന ലക്ഷ്യങ്ങളോടെയാണ് മസ്ജിദ് കൗൺസിൽ കേരള പ്രവർത്തിക്കുന്നത്.
          </p>

          <p className="text-base leading-6 font-medium"
              style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            ഖത്വീബുമാർക്ക് ഖുത്ബകൾ കൂടുതൽ ഫലപ്രദമായി നിർവഹിക്കാൻ സഹായകമാകുന്ന വിധത്തിൽ വിവിധ വിഷയങ്ങളിലുള്ള സിനോപ്സിസുകളും പഠനസാമഗ്രികളും തയ്യാറാക്കി ലഭ്യമാക്കുന്നതും കൗൺസിലിന്റെ പ്രധാന സേവനങ്ങളിലൊന്നാണ്.
          </p>

          <p className="text-base leading-6 font-medium"
              style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            കേരളത്തിലെ എല്ലാ അഫിലിയേറ്റഡ് മസ്ജിദുകളും മികവിന്റെ മാതൃകകളായി വളരണമെന്നതാണ് കൗൺസിലിന്റെ ദീർഘകാല ലക്ഷ്യം. അതിന്റെ ഭാഗമായി തെരഞ്ഞെടുത്ത മസ്ജിദുകളെ കേന്ദ്രീകരിച്ച് 'എക്സലന്റ് മസ്ജിദ്' പദ്ധതി വിജയകരമായി നടപ്പിലാക്കി വരുന്നു.
          </p>

          <h3 className="text-3xl font-semibold text-green-900 mb-6 mt-12"
              style={{ fontFamily: 'var(--font-ml-title)' }}
          >
            മസ്ജിദുകൾ: മികവിന്റെ കേന്ദ്രങ്ങൾ
          </h3>

          <p className="text-base leading-6 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            അല്ലാഹുവിന്റെ ഭവനങ്ങളാണ് മസ്ജിദുകൾ. മുസ്‌ലിം സമൂഹത്തിന് ഹിദായത്തും ആത്മീയ വെളിച്ചവും പകരുന്ന ദൈവിക കേന്ദ്രങ്ങളാണവ. ഇസ്‌ലാമിക ആദർശവും വ്യക്തിത്വവും വളർത്തിയെടുക്കാനും, വിശ്വാസിയുടെ ജീവിതത്തെ ക്രമപ്പെടുത്താനും ആവശ്യമായ തസ്കിയത്തും (ആത്മശുദ്ധീകരണം) തർബിയത്തും (പരിശീലനം) നൽകുന്ന ജീവിതപാഠശാലകളുമാണ് മസ്ജിദുകൾ.
          </p>

          <p className="text-base leading-6 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദുകൾ ആരാധന നിർവഹിക്കുന്ന പുണ്യസ്ഥലങ്ങൾ മാത്രമല്ല; മുസ്‌ലിം സമൂഹത്തിന്റെ സാമൂഹിക, സാംസ്കാരിക, വിദ്യാഭ്യാസ, കുടുംബ, സാമ്പത്തിക, പൊതുജീവിത മേഖലകളിൽ ദിശാബോധം നൽകുകയും സമൂഹത്തിന്റെ പുരോഗതിക്ക് നേതൃത്വം നൽകുകയും ചെയ്യുന്ന സജീവ സ്ഥാപനങ്ങളുമാണ്. അല്ലാഹുവിന്റെ പ്രകാശം ഭൂമിയിൽ പ്രസരിപ്പിക്കുന്ന കേന്ദ്രങ്ങളെന്ന നിലയിലാണ് ഇസ്‌ലാം മസ്ജിദുകളെ കാണുന്നത്.
          </p>

          <h3 className="text-3xl font-semibold text-green-900 mb-6 mt-12"
              style={{ fontFamily: 'var(--font-ml-title)' }}
          >
            ക്ഷേമനിധി പദ്ധതികൾ
          </h3>

          <h4 className="text-xl font-semibold text-black mb-2"
              style={{ fontFamily: 'var(--font-ml-title)' }}
          >
            ഇമാം–മുഅദ്ദിൻ ക്ഷേമനിധി
          </h4>

          <p className="text-base leading-6 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദ് കൗൺസിൽ കേരളയിൽ രജിസ്റ്റർ ചെയ്ത മസ്ജിദുകളിൽ സേവനമനുഷ്ഠിക്കുന്ന ഇമാമുമാർക്കും മുഅദ്ദിന്മാർക്കും അത്യാവശ്യ ഘട്ടങ്ങളിൽ സാമ്പത്തിക സഹായം ലഭ്യമാക്കുന്നതിനായി ആരംഭിച്ച പദ്ധതിയാണ് ഇമാം–മുഅദ്ദിൻ ക്ഷേമനിധി.
          </p>

          <p className="text-base leading-6 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            വീടുനിർമാണം, അറ്റകുറ്റപ്പണികൾ, ചികിത്സ, വിവാഹം തുടങ്ങിയ ആവശ്യങ്ങൾക്കായി സാമ്പത്തികമായി പ്രയാസം അനുഭവിക്കുന്നവർക്ക് കൈത്താങ്ങാകുക എന്നതാണ് പദ്ധതിയുടെ ലക്ഷ്യം. അഫിലിയേറ്റഡ് മസ്ജിദുകളിൽ റമദാനിലെ ഒരു ജുമുഅ ദിവസത്തെ വാർഷിക ഫണ്ട് ശേഖരണത്തിലൂടെയാണ് ഈ പദ്ധതിക്കാവശ്യമായ ധനം സമാഹരിക്കുന്നത്.
          </p>

          <h4 className="text-xl font-semibold text-black mb-2 mt-6"
              style={{ fontFamily: 'var(--font-ml-title)' }}
          >
            മസ്ജിദ് ഫണ്ട്
          </h4>

          <p className="text-base leading-6 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            സാമ്പത്തികമായി പിന്നാക്കം നിൽക്കുന്ന മസ്ജിദുകളെ സഹായിക്കുന്നതിനായി മസ്ജിദ് ഫണ്ട് എന്ന പേരിൽ മറ്റൊരു ക്ഷേമപദ്ധതിയും നടപ്പിലാക്കി വരുന്നു.
          </p>

          <p className="text-base leading-6 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            പള്ളി നിർമ്മാണം, പുനർനിർമ്മാണം, അറ്റകുറ്റപ്പണികൾ തുടങ്ങിയ ആവശ്യങ്ങൾക്കാണ് ഈ ഫണ്ടിൽ നിന്ന് സഹായം നൽകുന്നത്. നിർദ്ദിഷ്ട വെള്ളിയാഴ്ചകളിൽ അഫിലിയേറ്റഡ് ജുമുഅ മസ്ജിദുകളിൽ നടത്തുന്ന പ്രതിമാസ ഫണ്ട് ശേഖരണത്തിലൂടെയാണ് ഈ പദ്ധതിക്കുള്ള വിഭവങ്ങൾ കണ്ടെത്തുന്നത്.
          </p>

          <h4 className="text-xl font-semibold text-black mb-2 mt-6"
              style={{ fontFamily: 'var(--font-ml-title)' }}
          >
            മസ്ജിദ് എക്സലൻസ് അവാർഡ്
          </h4>

          <p className="text-base leading-6 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദുകളെ മികവിന്റെ കേന്ദ്രങ്ങളാക്കി മാറ്റുന്നതിനുള്ള പ്രോത്സാഹന പദ്ധതിയായി മസ്ജിദ് എക്സലൻസ് അവാർഡ് മസ്ജിദ് കൗൺസിൽ കേരള പ്രഖ്യാപിച്ചിട്ടുണ്ട്.
          </p>

          <p className="text-base leading-6 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദ് കൗൺസിലിൽ അഫിലിയേറ്റ് ചെയ്ത മസ്ജിദുകൾക്കായാണ് ഈ അവാർഡ്. മികവുറ്റ പ്രവർത്തനങ്ങൾ നടത്തുന്ന മസ്ജിദുകളെ ആദരിക്കുന്നതിനായി യഥാക്രമം ₹1,00,000, ₹75,000, ₹50,000 എന്നിങ്ങനെ സമ്മാനത്തുകകൾ നൽകിവരുന്നു. മികച്ച പ്രവർത്തനങ്ങൾക്ക് പ്രചോദനമേകുകയും മാതൃകാപരമായ മസ്ജിദ് പ്രവർത്തനങ്ങൾ സമൂഹത്തിലുടനീളം വ്യാപിപ്പിക്കുകയും ചെയ്യുക എന്നതാണ് ഈ അവാർഡിന്റെ ലക്ഷ്യം.
          </p>
          </div>
      </div>
    </div>
  );
};

export default About;
