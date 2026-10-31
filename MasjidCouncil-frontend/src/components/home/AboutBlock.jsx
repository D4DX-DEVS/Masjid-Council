import React from 'react';
import { ArrowRight } from 'lucide-react';
import SmartLink from './SmartLink';
import bgPattern from '../../assets/bg.webp';
import { ALIGN_CLASS, PADDING_CLASS, WIDTH_CLASS, color, imageSrc } from '../../lib/homepage/render';

const UNDERLINE_POSITION = { left: 'left-0', center: 'left-1/2 -translate-x-1/2', right: 'right-0' };

const AboutBlock = ({ section }) => {
  const { layout, content } = section;
  const align = layout.align || 'left';
  const image = imageSrc(content.image);
  const imageRight = content.imagePosition === 'right';
  const paragraphs = String(content.body || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="px-4 md:px-8 lg:px-16" style={{ backgroundColor: color(layout.bg, 'transparent') }}>
      <div id="about-section" className="relative rounded-2xl overflow-hidden">
        {content.showPattern !== false && (
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `url(${bgPattern})`,
              backgroundSize: 'auto',
              backgroundPosition: 'top left',
              backgroundRepeat: 'repeat',
            }}
          />
        )}
        <div className={`relative px-5 sm:px-8 md:px-12 lg:px-16 ${PADDING_CLASS[layout.paddingY] || PADDING_CLASS.md}`}>
          <div className={`${WIDTH_CLASS[layout.width] || WIDTH_CLASS.wide} mx-auto`}>
            <div className={`grid grid-cols-1 gap-8 lg:gap-12 items-center ${image ? 'lg:grid-cols-2' : ''}`}>
              {image && (
                <div className={`order-2 ${imageRight ? 'lg:order-2' : 'lg:order-1'} lg:self-center`}>
                  <div className="relative">
                    <img
                      src={image}
                      alt="About Masjid Council Kerala"
                      className="w-full h-56 sm:h-72 lg:h-[380px] object-cover rounded-xl shadow-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
                  </div>
                </div>
              )}

              <div className={`order-1 ${imageRight ? 'lg:order-1' : 'lg:order-2'} space-y-6 ${ALIGN_CLASS[align]}`}>
                {content.heading && (
                  <h2
                    className="text-2xl sm:text-3xl md:text-4xl font-bold relative pb-2"
                    style={{ fontFamily: 'var(--hp-font-heading)', color: color(layout.headingColor, 'var(--hp-heading)') }}
                  >
                    {content.heading}
                    <span
                      className={`absolute bottom-0 w-20 h-1 rounded-full ${UNDERLINE_POSITION[align]}`}
                      style={{ backgroundColor: 'var(--hp-accent)' }}
                    />
                  </h2>
                )}

                <div
                  className="space-y-4 leading-relaxed"
                  style={{ fontFamily: 'var(--hp-font-body)', color: color(layout.textColor, 'var(--hp-text)') }}
                >
                  {paragraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      style={{
                        textAlign: align === 'left' ? 'justify' : align,
                        overflowWrap: 'break-word',
                        wordBreak: 'break-all',
                        fontSize: '15px',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {content.buttonLabel && (
                  <div className="pt-6">
                    <SmartLink
                      to={content.buttonLink}
                      className="inline-flex items-center gap-2 bg-[var(--hp-primary)] hover:bg-[var(--hp-primary-hover)] text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                      style={{ fontFamily: 'var(--hp-font-latin)' }}
                    >
                      {content.buttonLabel}
                      <ArrowRight className="w-4 h-4" />
                    </SmartLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutBlock;
