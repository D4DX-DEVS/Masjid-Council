import React, { useEffect } from 'react';
import { MapPin, Phone, Mail, Target, Award } from 'lucide-react';
import logo from '../assets/logo.png';
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
      <div className="pl-16 pr-8 md:pl-20 md:pr-12 lg:pl-24 lg:pr-16 py-16 pt-32 relative z-20">
        
        <div className="space-y-4 text-black leading-relaxed text-justify"
             style={{ fontFamily: "Noto Sans Malayalam" }}
        >
          <h3 className="text-3xl font-semibold text-black mb-6"
              style={{ fontFamily: "Anek Malayalam Variable" }}
          >
            മസ്ജിദ് കൗൺസിൽ കേരള
          </h3>
          
          <p className="text-base leading-8 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദുകളെ മികവിൻ്റെ കേന്ദ്രങ്ങളാക്കുക എന്ന ലക്ഷ്യത്തോടെ 1990-ൽ സ്ഥാപിതമായ സംവിധാനമാണ് മസ്ജിദ് കൗൺസിൽ കേരള.
          </p>
          
          <p className="text-base leading-8 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദുകളുടെയും മഹല്ലുകളുടെയും പ്രവർത്തനങ്ങൾക്ക് മേൽനോട്ടം വഹിക്കുകയും ആവശ്യമായ മാർഗ്ഗനിർദ്ദേശങ്ങൾ നൽകുകയും ചെയ്യുക, ഖുത്ബയും ഇമാമത്തും നിർവ്വഹിക്കുവാൻ പ്രാപ്തരായ വ്യക്തികളെ കണ്ടെത്തി പരിശീലനം നൽകുക, നിലവിൽ മസ്ജിദുകളിൽ സേവനം ചെയ്തുവരുന്ന ഖത്വീബുമാരെയും ഇമാമുമാരെയും ശാക്തീകരിക്കുന്നതിനാവശ്യമായ പദ്ധതികൾ നടപ്പിലാക്കുക, മസ്ജിദ്, മഹല്ല് കമ്മിറ്റി ഭാരവാഹികൾക്ക് ആവശ്യമായ പരിശീലന പരിപാടികൾ സംഘടിപ്പിക്കുക തുടങ്ങിയ സുപ്രധാന ഉദ്ദേശ്യ ലക്ഷ്യങ്ങളോടെയാണ് മസ്ജിദ് കൗൺസിൽ കേരള പ്രവർത്തിക്കുന്നത്. കൂടാതെ ഖത്വീബുമാർക്ക് ഖുത്ബ നിർവ്വഹിക്കുന്നതിന് സഹായകമാകും വിധം വിവിധ വിഷയങ്ങളിൽ സിനോപ്സിസുകൾ തയ്യാറാക്കി നൽകുകയും ചെയ്യുന്നുണ്ട്.
          </p>
          
          <p className="text-base leading-8 font-medium"
              style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദ് കൗൺസിൽ കേരളക്ക് കീഴിലുള്ള മുഴുവൻ മസ്ജിദുകളും മികവിൻ്റെ കേന്ദ്രങ്ങളായി മാറണം എന്നാണ് നമ്മുടെ ലക്ഷ്യം. അതിൻ്റെ ഭാഗമായി തെരഞ്ഞെടുക്കപ്പെട്ട മസ്ജിദുകൾ കേന്ദ്രീകരിച്ച് എക്സലൻ്റ് മസ്ജിദ് പദ്ധതി നടപ്പിലാക്കിവരുന്നു.
          </p>
            
          <h3 className="text-3xl font-semibold text-black mb-6 mt-12"
              style={{ fontFamily: "Anek Malayalam Variable" }}
          >
            മസ്ജിദുകൾ മികവിൻ്റെ കേന്ദ്രങ്ങൾ
          </h3>
          
          <p className="text-base leading-8 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            അല്ലാഹുവിൻ്റെ ഭവനങ്ങളാണ് മസ്ജിദുകൾ. മുസ്‌ലിം ഉമ്മത്തിന് ഹിദായത്ത് നൽകുന്ന കേന്ദ്രമാണത്. ഇസ്‌ലാമിക ആദർശവും വ്യക്തിത്വവും രൂപപ്പെടുത്തുവാൻ മുസ്‌ലിം ഉമ്മത്തിനെ പ്രാപ്തമാക്കുന്ന ദൈവിക സ്ഥാപനമാണ് മസ്ജിദ്. മസ്ജിദുമായി ബന്ധപ്പെടുന്ന മുസ്‌ലിമിന്റെ ജീവിതം ക്രമീകരിക്കാനും ആവശ്യമായ തസ്കിയത്തും തർബിയത്തും നല്‍കുന്ന പാഠശാല കൂടിയാണ് മസ്ജിദുകൾ.
          </p>
          
          <p className="text-base leading-8 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മുസ്‌ലിം ഉമ്മത്തിൻ്റെ ഊർജ്ജ സംഭരണ കേന്ദ്രങ്ങളാണവ. അതോടൊപ്പം അല്ലാഹുവിൻ്റെ പ്രകാശം ഭൂമിയിൽ പ്രസരിക്കുന്ന കേന്ദ്രങ്ങളാണത്. മസ്ജിദ് എന്ന പദത്തിനർഥം സുജൂദ് ചെയ്യുന്ന ഇടം എന്നാണ്. നാഥൻ്റെ മുമ്പിൽ ജീവിതം സമർപ്പിക്കാൻ വിശ്വാസികളെ പ്രാപ്തമാക്കുന്ന കേന്ദ്രം എന്നാണ് അതുകൊണ്ട് അർഥമാക്കുന്നത്.
          </p>
          
          <p className="text-base leading-8 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദുകൾ മുഖ്യമായും ആരാധനകൾ നിർവ്വഹിക്കുന്ന പവിത്രമായ ഇടമാണ്. എന്നാൽ ആരാധനകൾക്ക് വേണ്ടി മാത്രം തുറന്നിടുകയും മറ്റു സന്ദർഭങ്ങളിൽ അടഞ്ഞുകിടക്കുകയും ചെയ്യുന്ന കേവല ആത്മീയ കേന്ദ്രമല്ല മസ്ജിദുകൾ. മറിച്ച് മുസ്‌ലിം ഉമ്മത്തിൻ്റെ സാമൂഹികവും സാംസ്കാരികവും സാമ്പത്തികവും രാഷ്ട്രീയവും കുടുംബപരവുമായ നിഖില മേഖലകളിലും ദിശ നിർണ്ണയിക്കുന്നതിനും പുരോഗതി ഉറപ്പു വരുത്തുന്നതിനും നിർണായക പങ്ക് വഹിക്കുന്ന കേന്ദ്രങ്ങളാണ് മസ്ജിദുകൾ.
          </p>
          
          <h3 className="text-3xl font-semibold text-black mb-6 mt-12"
              style={{ fontFamily: "Anek Malayalam Variable" }}
          >
            ക്ഷേമ നിധികൾ
          </h3>
          
          <p className="text-base leading-8 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദ് കൗൺസിൽ കേരളയിൽ റെജിസ്റ്റർ ചെയ്ത മസ്ജിദുകളിൽ സേവനമനുഷ്ഠിക്കുന്നവർക്ക് അത്യാവശ്യ സന്ദർഭങ്ങളിൽ സാമ്പത്തിക സഹായം ലഭ്യമാക്കുന്നതിനായി ആരംഭിച്ച പദ്ധതിയാണ് ഇമാം മുഅദ്ദിൻ ക്ഷേമ നിധി. വീട് നിർമ്മാണവും അറ്റകുറ്റപ്പണികളും, വിവാഹം, ചികിത്സ തുടങ്ങി സാമ്പിത്തികമായി ഞെരുക്കമനുഭവിക്കുന്ന സന്ദർഭങ്ങളിൽ കൈത്താങ്ങാകുക എന്ന ലക്ഷ്യത്തോടെയാണ് ഈ പദ്ധതി നടപ്പിലാക്കുന്നത്. മസ്ജിദ് കൗൺസിലിൽ അഫിലിയേറ്റ് ചെയ്ത മസ്ജിദുകളിൽ നിന്നും റമാദാൻ മാസത്തിലെ ഒരു ജുമുഅ ദിവസം നടക്കുന്ന വാർഷിക ഫണ്ട് ശേഖരണം വഴിയാണ് ഇതിനാവശ്യമായ തുക കണ്ടെത്തുന്നത്.
          </p>
          
          <p className="text-base leading-8 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            സാമ്പത്തികമായി പിന്നാക്കം നിൽക്കുന്ന മസ്ജിദുകളെ സഹായിക്കുന്നതിനായി മസ്ജിദ് ഫണ്ട് എന്ന പേരിൽ മറ്റൊരു സഹായ നിധിയും നടപ്പിലാക്കി വരുന്നു. പള്ളി പുനർനിർമ്മാണം, അറ്റകുറ്റപ്പണികൾ തുടങ്ങിയ ആവശ്യങ്ങൾക്കാണ് ഇതിൽ നിന്നും സഹായം അനുവദിക്കുന്നത്. ജുമുഅ നടക്കുന്ന മസ്ജിദുകളിൽ നിർണ്ണിത വെള്ളിയാഴ്ചകളിൽ നടക്കുന്ന പ്രതിമാസ കളക്ഷനിലൂടെയാണ് ഇതിന് വേണ്ട ഫണ്ട് കണ്ടെത്തുന്നത്.
          </p>
          
          <h3 className="text-3xl font-semibold text-black mb-6 mt-12"
              style={{ fontFamily: "Anek Malayalam Variable" }}
          >
            മസ്ജിദ് എക്സലൻസ് അവാർഡ്
          </h3>
          
          <p className="text-base leading-8 font-medium"
             style={{ fontFamily: "Noto Sans Malayalam" }}
          >
            മസ്ജിദുകൾ മികവിൻ്റെ കേന്ദ്രങ്ങളായി മാറ്റുന്നതിൻ്റെ ഭാഗമായി മസ്ജിദ് കൗൺസിൽ കേരള നടപ്പിലാക്കുന്ന പുതിയ പദ്ധതിയാണ് മസ്ജിദ് എകസലൻസി അവാർഡ്. മസ്ജിദ് കൗൺസിലിൽ അഫിലിയേറ്റ് ചെയ്ത മസ്ജിദുൾക്ക് വേണ്ടിയാണ് ഈ അവാർഡ് പ്രഖ്യാപിച്ചിരിക്കുന്നത്. യഥാക്രമം 100,000, 75,000, 50,000 രൂപ വീതമാണ് അവാർഡ് തുകയായി നൽകുന്നത്.
          </p>
          </div>
      </div>
    </div>
  );
};

export default About;
