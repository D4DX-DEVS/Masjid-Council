import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { ALIGN_CLASS, PADDING_CLASS, WIDTH_CLASS, color, cssUrl } from '../../lib/homepage/render';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TrackBlock = ({ section }) => {
  const { layout, content } = section;
  const [referenceNumber, setReferenceNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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

  const align = ALIGN_CLASS[layout.align] || 'text-center';

  return (
    <div id="track-section" className={`px-4 sm:px-6 ${PADDING_CLASS[layout.paddingY] || PADDING_CLASS.sm}`}>
      <div
        className={`relative w-full ${WIDTH_CLASS[layout.width] || WIDTH_CLASS.wide} mx-auto rounded-3xl overflow-hidden shadow-lg`}
        style={{
          // ponytail: the default strip is wide (~5.8:1); `cover` would crop the mosques off
          // both edges, so pin it full-width at the bottom and let its own pale-mint top blend
          // into the matching backgroundColor.
          backgroundColor: color(layout.bg, '#eef4ec'),
          backgroundImage: cssUrl(content.bgImage),
          backgroundSize: '100% auto',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="relative px-5 pt-6 pb-8 sm:px-10 sm:pt-7 sm:pb-10">
          {content.heading && (
            <h2
              className={`text-xl sm:text-2xl font-bold ${align}`}
              style={{ fontFamily: 'var(--hp-font-latin)', color: color(layout.headingColor, 'var(--hp-heading)') }}
            >
              {content.heading}
            </h2>
          )}
          {content.subtitle && (
            <p
              className={`mt-1.5 text-xs sm:text-sm max-w-xl ${align} ${
                layout.align === 'left' ? '' : layout.align === 'right' ? 'ml-auto' : 'mx-auto'
              }`}
              style={{ fontFamily: 'var(--hp-font-latin)', color: color(layout.textColor, '#4b5563') }}
            >
              {content.subtitle}
            </p>
          )}

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
                  onKeyDown={(e) => e.key === 'Enter' && handleTrackStatus()}
                  placeholder={content.placeholder}
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
                className="h-12 shrink-0 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--hp-primary)] hover:bg-[var(--hp-primary-hover)] disabled:opacity-60 text-white text-sm sm:text-base font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-700/30"
              >
                <Search className={`h-5 w-5 ${tracking ? 'animate-pulse' : ''}`} />
                {tracking ? 'Searching…' : content.buttonLabel || 'Track Status'}
              </button>
            </div>

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

            {results && results.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-gray-100" style={{ animation: 'mc-modal-in .25s ease-out' }}>
                {results.map((r, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900 text-sm truncate">{r.name || 'Application'}</p>
                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize flex-shrink-0 ${
                          r.status === 'approved'
                            ? 'bg-[#EAF6EF] text-[#1F6B3A] border border-green-200'
                            : r.status === 'rejected'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
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
  );
};

export default TrackBlock;
