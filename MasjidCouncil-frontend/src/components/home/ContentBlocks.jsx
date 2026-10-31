import React from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';
import SectionShell, { Paragraphs } from './SectionShell';
import SmartLink from './SmartLink';
import { ALIGN_CLASS, PADDING_CLASS, WIDTH_CLASS, color, cssUrl, imageSrc } from '../../lib/homepage/render';

// Sections the admin adds from the picker that are mostly words: text, image + text, call to
// action and the notice bar. See CollectionBlocks.jsx for the ones built from a list of items.

const button =
  'inline-flex items-center gap-2 rounded-full bg-[var(--hp-primary)] px-7 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[var(--hp-primary-hover)] hover:shadow-xl';

const bodyStyle = (layout) => ({
  fontFamily: 'var(--hp-font-body)',
  color: color(layout.textColor, 'var(--hp-text)'),
  fontSize: '15px',
});

export const TextBlock = ({ section }) => {
  const { layout, content } = section;
  return (
    <SectionShell section={section} defaultWidth="narrow">
      <div className={`space-y-4 leading-relaxed ${ALIGN_CLASS[layout.align || 'center']}`} style={bodyStyle(layout)}>
        <Paragraphs text={content.body} />
      </div>
    </SectionShell>
  );
};

export const ImageTextBlock = ({ section }) => {
  const { layout, content } = section;
  const image = imageSrc(content.image);
  const imageRight = content.imagePosition === 'right';
  const align = layout.align || 'left';

  return (
    <section
      className={`px-4 sm:px-6 ${PADDING_CLASS[layout.paddingY] || PADDING_CLASS.md}`}
      style={{ backgroundColor: color(layout.bg, 'transparent') }}
    >
      <div
        className={`mx-auto grid grid-cols-1 items-center gap-8 lg:gap-12 ${image ? 'lg:grid-cols-2' : ''} ${
          WIDTH_CLASS[layout.width] || WIDTH_CLASS.wide
        }`}
      >
        {image && (
          <img
            src={image}
            alt=""
            className={`h-56 w-full rounded-xl object-cover shadow-xl sm:h-72 lg:h-[360px] ${imageRight ? 'lg:order-2' : ''}`}
          />
        )}
        <div className={`space-y-5 ${ALIGN_CLASS[align]}`}>
          {content.heading && (
            <h2
              className="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl"
              style={{ fontFamily: 'var(--hp-font-heading)', color: color(layout.headingColor, 'var(--hp-heading)') }}
            >
              {content.heading}
            </h2>
          )}
          <div className="space-y-4 leading-relaxed" style={bodyStyle(layout)}>
            <Paragraphs text={content.body} />
          </div>
          {content.buttonLabel && (
            <div className="pt-2">
              <SmartLink to={content.buttonLink} className={button} style={{ fontFamily: 'var(--hp-font-latin)' }}>
                {content.buttonLabel}
                <ArrowRight className="h-4 w-4" />
              </SmartLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const CtaBlock = ({ section }) => {
  const { layout, content } = section;
  const hasImage = Boolean(imageSrc(content.bgImage));
  const align = layout.align || 'center';

  return (
    <section className={`px-4 sm:px-6 ${PADDING_CLASS[layout.paddingY] || PADDING_CLASS.md}`}>
      <div
        className={`relative mx-auto overflow-hidden rounded-2xl px-6 py-10 shadow-lg sm:rounded-3xl sm:px-12 sm:py-14 ${
          WIDTH_CLASS[layout.width] || WIDTH_CLASS.normal
        } ${ALIGN_CLASS[align]}`}
        style={{
          backgroundColor: color(layout.bg, '#1f6b3a'),
          backgroundImage: hasImage ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), ${cssUrl(content.bgImage)}` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {content.heading && (
          <h2
            className="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl"
            style={{ fontFamily: 'var(--hp-font-heading)', color: color(layout.headingColor, '#ffffff') }}
          >
            {content.heading}
          </h2>
        )}
        {content.body && (
          <p
            className={`mt-3 max-w-2xl text-sm leading-relaxed whitespace-pre-line sm:text-base ${
              align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''
            }`}
            style={{ fontFamily: 'var(--hp-font-body)', color: color(layout.textColor, '#e7f5ea') }}
          >
            {content.body}
          </p>
        )}
        {content.buttonLabel && (
          <div className="mt-7">
            <SmartLink
              to={content.buttonLink}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-gray-900 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{ fontFamily: 'var(--hp-font-latin)' }}
            >
              {content.buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </SmartLink>
          </div>
        )}
      </div>
    </section>
  );
};

export const NoticeBlock = ({ section }) => {
  const { layout, content } = section;
  if (!content.text) return null;
  const textColor = color(layout.textColor, '#78350f');

  return (
    <div className="px-4 py-3 sm:px-6" style={{ backgroundColor: color(layout.bg, '#fef3c7'), color: textColor }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-x-4 gap-y-1 text-center text-sm sm:flex-row">
        <span className="inline-flex items-center gap-2" style={{ fontFamily: 'var(--hp-font-body)' }}>
          <Megaphone className="h-4 w-4 shrink-0" />
          <span className="whitespace-pre-line">{content.text}</span>
        </span>
        {content.linkLabel && (
          <SmartLink
            to={content.link}
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline"
            style={{ fontFamily: 'var(--hp-font-latin)' }}
          >
            {content.linkLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </SmartLink>
        )}
      </div>
    </div>
  );
};
