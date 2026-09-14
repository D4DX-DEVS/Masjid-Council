import logo from '../assets/logo.webp';
import { ORG_ADDRESS, ORG_PHONE, ORG_EMAIL, ORG_SITE } from '../lib/seo';

// Official letterhead for printed / PDF copies of an application.
// Hidden on screen; revealed by @media print CSS and by the PDF export's onclone.
export default function PrintLetterhead({ title, referenceNumber, date }) {
  return (
    <div className="print-only mb-4">
      <div className="flex items-center gap-4 pb-3">
        <img src={logo} alt="Masjid Council Kerala" className="h-16 w-auto" />
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-gray-900 tracking-wide">MASJID COUNCIL KERALA</h1>
          <p className="text-sm text-gray-700">മസ്ജിദ് കൗൺസിൽ കേരള</p>
          {/* Address, phone, email and site sit on one line so the letterhead stays
              two rows tall — a stacked block pushed the application content off page 1. */}
          <p className="text-[10px] leading-snug text-gray-600">
            {ORG_ADDRESS} <span className="text-gray-400">•</span> {ORG_PHONE}{' '}
            <span className="text-gray-400">•</span> {ORG_EMAIL}{' '}
            <span className="text-gray-400">•</span> {ORG_SITE}
          </p>
        </div>
        {/* spacer mirrors the logo so the text block stays centered */}
        <div className="w-16" />
      </div>
      <div className="border-t-2 border-b border-gray-800 py-2 text-center">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="flex justify-between text-xs text-gray-600 pt-2">
        <span>{referenceNumber ? `അപേക്ഷ നമ്പർ: ${referenceNumber}` : ''}</span>
        <span>{date ? `തീയതി: ${date}` : ''}</span>
      </div>
    </div>
  );
}
