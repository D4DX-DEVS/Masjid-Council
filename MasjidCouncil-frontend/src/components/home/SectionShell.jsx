import React from 'react';
import { ALIGN_CLASS, PADDING_CLASS, WIDTH_CLASS, color } from '../../lib/homepage/render';

const MARGIN = { left: '', center: 'mx-auto', right: 'ml-auto' };

/**
 * The frame every added section sits in: background, vertical spacing, content width, and an
 * optional heading + subtitle in the section's alignment and colours.
 */
const SectionShell = ({ section, children, defaultWidth = 'normal' }) => {
  const { layout, content } = section;
  const align = layout.align || 'center';

  return (
    <section
      className={`px-4 sm:px-6 ${PADDING_CLASS[layout.paddingY] || PADDING_CLASS.md}`}
      style={{ backgroundColor: color(layout.bg, 'transparent') }}
    >
      <div className={`mx-auto ${WIDTH_CLASS[layout.width] || WIDTH_CLASS[defaultWidth]}`}>
        {(content.heading || content.subtitle) && (
          <div className={`mb-6 sm:mb-8 ${ALIGN_CLASS[align]}`}>
            {content.heading && (
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight"
                style={{ fontFamily: 'var(--hp-font-heading)', color: color(layout.headingColor, 'var(--hp-heading)') }}
              >
                {content.heading}
              </h2>
            )}
            {content.subtitle && (
              <p
                className={`mt-3 max-w-2xl text-sm sm:text-base leading-relaxed whitespace-pre-line ${MARGIN[align]}`}
                style={{ fontFamily: 'var(--hp-font-body)', color: color(layout.textColor, 'var(--hp-muted)') }}
              >
                {content.subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

/** Splits admin-typed text into paragraphs on blank lines. */
export const Paragraphs = ({ text, className = '', style }) =>
  String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={index} className={`whitespace-pre-line ${className}`} style={style}>
        {paragraph}
      </p>
    ));

export default SectionShell;
