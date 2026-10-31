import React, { useEffect, useState } from 'react';
import { ALIGN_CLASS, color, imageSrc } from '../../lib/homepage/render';

const SHADOW = '0 2px 10px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)';

const HeroBlock = ({ section }) => {
  const { layout, content } = section;
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    // Trigger image animation after component mounts
    const timer = setTimeout(() => setIsImageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const src = imageSrc(content.bgImage);
  const textColor = color(layout.textColor, '#ffffff');
  const align = ALIGN_CLASS[layout.align] || 'text-center';

  return (
    // The default artwork carries the mosque, green wash and the bottom wave. Shown at full
    // size (no crop) from sm up; text scales in vw so it keeps its position on the banner at
    // every width.
    // ponytail: from sm up the box uses the banner's aspect minus the 72 blank rows the artwork
    // carries below the wave (1751x898 -> 1751x826), anchored to the top so object-cover crops
    // only that dead band. Mobile keeps a fixed height (an aspect box would be too short for the
    // text) and stays centre-cropped, where anchoring to the top would cut the wave off instead.
    <div
      id="home-section"
      className="relative h-[440px] sm:h-auto sm:aspect-[1751/826] overflow-hidden"
      style={{ backgroundColor: color(layout.bg, '#186b3a') }}
    >
      {src && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover object-[62%_center] sm:object-[62%_top] transition-opacity duration-700 ease-out ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Text sits slightly above the optical centre, clear of the wave. Height is fixed on the
          wrapper (not the text) so scaled-up text never overflows the image. */}
      <div className="relative z-10 h-full flex items-center justify-center px-6 pb-[13%] sm:px-10">
        <div className={`w-full max-w-[1000px] px-4 py-8 sm:py-10 ${align}`}>
          {content.ayah && (
            <p
              className="mc-hero-in mc-hero-down"
              dir="rtl"
              style={{
                fontFamily: 'var(--hp-font-arabic)',
                // ponytail: vw-based clamp instead of breakpoint steps — the text shrinks
                // continuously with the banner instead of staying oversized on mid-size screens.
                fontSize: 'clamp(18px, 3.1vw, 42px)',
                lineHeight: 1.8,
                color: textColor,
                textShadow: SHADOW,
              }}
            >
              {content.ayah}
            </p>
          )}

          {content.translation && (
            <p
              className={`mc-hero-in mc-hero-fade mt-3 sm:mt-4 max-w-[640px] italic font-medium leading-relaxed ${
                layout.align === 'left' ? '' : layout.align === 'right' ? 'ml-auto' : 'mx-auto'
              }`}
              style={{
                fontFamily: 'var(--hp-font-hero)',
                fontSize: 'clamp(11px, 1.15vw, 15px)',
                color: textColor,
                opacity: 0.9,
                animationDelay: '150ms',
              }}
            >
              {content.translation}
            </p>
          )}

          {content.reference && (
            <p
              className="mc-hero-in mc-hero-fade mt-2"
              style={{
                fontFamily: 'var(--hp-font-hero)',
                fontSize: 'clamp(9px, 0.92vw, 12px)',
                color: textColor,
                opacity: 0.7,
                animationDelay: '250ms',
              }}
            >
              {content.reference}
            </p>
          )}

          {content.titleMl && (
            <h1
              className="mc-hero-in mc-hero-up mt-6 sm:mt-8 font-bold"
              style={{
                fontFamily: 'var(--hp-font-heading)',
                // ponytail: 2.2vw = the 42px-at-1920 ratio, so the heading keeps the desktop
                // footprint on the artwork at every width instead of colliding with the minaret.
                fontSize: 'clamp(18px, 2.2vw, 42px)',
                color: color(layout.headingColor, '#f8f3d8'),
                // ponytail: Malayalam glyph ink runs ~1.27x the font size, so a 1.1 line-height
                // made wrapped lines collide on mid-size screens.
                lineHeight: 1.4,
                animationDelay: '350ms',
                textShadow: '0 2px 12px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)',
              }}
            >
              {content.titleMl}
            </h1>
          )}

          {content.titleEn && (
            <p
              className="mc-hero-in mc-hero-up mt-4 sm:mt-5 font-medium"
              style={{
                fontFamily: 'var(--hp-font-hero)',
                fontSize: 'clamp(13px, 1.4vw, 27px)',
                letterSpacing: '0.5px',
                color: textColor,
                animationDelay: '550ms',
                textShadow: SHADOW,
              }}
            >
              {content.titleEn}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroBlock;
