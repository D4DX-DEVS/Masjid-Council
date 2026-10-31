import React from 'react';
import { ArrowRight } from 'lucide-react';
import SmartLink from './SmartLink';
import { ALIGN_CLASS, PADDING_CLASS, WIDTH_CLASS, color, imageSrc } from '../../lib/homepage/render';

const UNDERLINE_POSITION = { left: 'left-0', center: 'left-1/2 -translate-x-1/2', right: 'right-0' };

// Sits on pale mint by default: publications and അപേക്ഷകൾ are both strips of white cards, so
// they only read as two sections if the ground behind them differs.
const ApplicationsBlock = ({ section }) => {
  const { layout, content } = section;
  const items = Array.isArray(content.items) ? content.items : [];
  const align = layout.align || 'center';

  return (
    <div
      id="applications-section"
      className={`px-4 ${PADDING_CLASS[layout.paddingY] || PADDING_CLASS.md}`}
      style={{ backgroundColor: color(layout.bg, 'transparent') }}
    >
      {content.heading && (
        <div className={`${WIDTH_CLASS[layout.width] || WIDTH_CLASS.normal} mx-auto ${ALIGN_CLASS[align]}`}>
          <h2
            className="inline-block text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 relative leading-tight pb-1"
            style={{ fontFamily: 'var(--hp-font-heading)', color: color(layout.headingColor, 'var(--hp-heading)') }}
          >
            {content.heading}
            <span
              className={`absolute bottom-0 w-24 h-0.5 ${UNDERLINE_POSITION[align]}`}
              style={{ backgroundColor: 'var(--hp-accent)' }}
            />
          </h2>
        </div>
      )}

      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mx-auto ${
          WIDTH_CLASS[layout.width] || WIDTH_CLASS.normal
        }`}
      >
        {items.map((app, index) => {
          const icon = imageSrc(app.icon);
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              <div
                className="w-14 h-14 rounded-full overflow-hidden mb-4 shadow-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6fae44 0%, #3f7f34 55%, #1e5a30 100%)' }}
              >
                {icon && <img src={icon} alt="" className="w-8 h-8 object-contain" />}
              </div>

              <h3
                className="text-lg font-bold leading-snug"
                style={{ fontFamily: 'var(--hp-font-latin)', color: color(layout.textColor, 'var(--hp-text)') }}
              >
                {app.title}
              </h3>
              {app.subtitle && (
                <p className="text-sm mt-1" style={{ fontFamily: 'var(--hp-font-body)', color: 'var(--hp-primary-hover)' }}>
                  {app.subtitle}
                </p>
              )}
              {app.description && (
                <p className="text-sm mt-3 leading-relaxed" style={{ fontFamily: 'var(--hp-font-latin)', color: 'var(--hp-muted)' }}>
                  {app.description}
                </p>
              )}

              {app.buttonLabel && (
                <div className="mt-auto w-full pt-6">
                  <SmartLink
                    to={app.link}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[var(--hp-primary)] hover:bg-[var(--hp-primary-hover)] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
                    style={{ fontFamily: 'var(--hp-font-latin)' }}
                  >
                    {app.buttonLabel}
                    <ArrowRight className="w-4 h-4" />
                  </SmartLink>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationsBlock;
