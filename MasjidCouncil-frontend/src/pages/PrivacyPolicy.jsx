import React, { useEffect } from 'react';
import mainAboutUs from '../assets/aboutMain.webp';

const PrivacyPolicy = () => {
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
      <div className="absolute inset-0 bg-white/70"></div>
      <div className="px-4 sm:px-6 lg:px-8 py-16 relative z-20 max-w-4xl mx-auto">
        <div className="space-y-4 text-gray-700 leading-7 bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-black/5 p-6 sm:p-10 lg:p-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-green-900 mb-8">Privacy Policy</h1>
          <p>
            Masjid Council Kerala ("we", "our", "us") respects your privacy and is committed to
            protecting the personal information you share with us through this website and its
            application forms.
          </p>

          <h2 className="text-xl font-semibold text-green-900 mt-8 mb-2">Information We Collect</h2>
          <p>
            When you submit an application (masjid affiliation, welfare fund, mosque fund, or
            khateeb registration), we collect information such as your name, contact number,
            mosque/mahallu details, and any documents you choose to upload.
          </p>

          <h2 className="text-xl font-semibold text-green-900 mt-8 mb-2">How We Use Your Information</h2>
          <p>
            Information collected is used solely to process your application, verify eligibility,
            and communicate updates about its status. We do not sell or rent your personal
            information to third parties.
          </p>

          <h2 className="text-xl font-semibold text-green-900 mt-8 mb-2">Data Security</h2>
          <p>
            We take reasonable technical and organizational measures to protect your data from
            unauthorized access, alteration, or disclosure.
          </p>

          <h2 className="text-xl font-semibold text-green-900 mt-8 mb-2">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:masjidcouncilkerala@gmail.com" className="text-green-700 underline">
              masjidcouncilkerala@gmail.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
