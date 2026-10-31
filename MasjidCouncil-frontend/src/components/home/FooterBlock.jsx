import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import dxLogo from '../../assets/dx-logo-sml2.webp';
import footerLogo from '../../assets/mc-logo2.webp';
import { color, mapEmbedSrc } from '../../lib/homepage/render';

const FooterBlock = ({ section }) => {
  const { layout, content } = section;
  const textColor = color(layout.textColor, '#dcfce7');
  const headingColor = color(layout.headingColor, '#ffffff');
  const map = content.showMap !== false ? mapEmbedSrc(content.mapEmbedUrl) : '';
  const phoneHref = String(content.phone || '').replace(/[^\d+]/g, '');
  const linkClass = 'text-[13px] hover:opacity-80 transition';

  return (
    <div
      id="contact-section"
      className="relative"
      style={{ backgroundColor: color(layout.bg, '#477d33'), fontFamily: 'var(--hp-font-latin)' }}
    >
      <div className="h-3 w-full absolute bottom-0 left-0" style={{ backgroundColor: color(content.stripeColor, '#304e26') }} />

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-12">
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-10 ${map ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="w-12 h-12 lg:w-20 lg:h-20">
              <img src={footerLogo} alt="Masjid Council Kerala" className="object-contain w-full h-full" />
            </div>
            {content.description && (
              <p className="text-[11px] lg:text-xs leading-relaxed max-w-xs mt-2 lg:mt-3" style={{ color: textColor, opacity: 0.9 }}>
                {content.description}
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-2 lg:space-y-3 flex flex-col items-center sm:items-start text-center sm:text-left">
            <h3 className="text-sm lg:text-base font-semibold" style={{ color: headingColor }}>Quick Links</h3>
            <ul className="space-y-1.5" style={{ color: textColor }}>
              <li><Link to="/" className={linkClass}>Home</Link></li>
              <li><a href="/#applications-section" className={linkClass}>Applications</a></li>
              <li><Link to="/about" className={linkClass}>About Us</Link></li>
              <li><Link to="/privacy-policy" className={linkClass}>Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-2 lg:space-y-3" style={{ color: textColor }}>
            <h3 className="text-sm lg:text-base font-semibold" style={{ color: headingColor }}>Contact Us</h3>
            {content.address && (
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <p className="min-w-0 text-[13px] leading-snug whitespace-pre-line">{content.address}</p>
              </div>
            )}
            {content.phone && (
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <a href={`tel:${phoneHref}`} className={`min-w-0 ${linkClass}`}>{content.phone}</a>
              </div>
            )}
            {content.email && (
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <a href={`mailto:${encodeURI(content.email)}`} className={`min-w-0 break-all ${linkClass}`}>
                  {content.email}
                </a>
              </div>
            )}
          </div>

          {/* Map — dropped on phones, it dominates the screen for little value */}
          {map && (
            <div className="hidden lg:block">
              <h3 className="text-base font-semibold mb-4" style={{ color: headingColor }}>Find Us</h3>
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg w-full max-w-[300px] h-[180px]">
                <iframe
                  src={map}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Masjid Council Kerala Location"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-4 lg:mt-8 pt-3 lg:pt-4 border-t border-white/15 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-2"
          style={{ color: textColor }}
        >
          <p className="flex items-center gap-2 text-[11px] lg:text-xs text-center">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            © {new Date().getFullYear()} Masjid Council Kerala. All Rights Reserved.
          </p>
          <a
            href="https://www.d4dx.co"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs hover:opacity-80 transition"
          >
            Powered by
            <img src={dxLogo} alt="D4DX Innovations LLP" className="h-6 w-auto shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default FooterBlock;
