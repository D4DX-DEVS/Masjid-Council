import React from 'react';
import { ArrowRight, ChevronDown, CirclePlay } from 'lucide-react';
import SectionShell from './SectionShell';
import SmartLink from './SmartLink';
import { color, imageSrc, youtubeEmbed } from '../../lib/homepage/render';

// Added sections built from a list of items: cards, gallery, FAQ — and the video, which shares
// their shell. Grid classes are spelled out in full so Tailwind sees every one of them.

const GRID = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export const CardsBlock = ({ section }) => {
  const { layout, content } = section;
  const items = Array.isArray(content.items) ? content.items : [];

  return (
    <SectionShell section={section}>
      <div className={`grid grid-cols-1 gap-6 ${GRID[content.columns] || GRID[3]}`}>
        {items.map((card, index) => {
          const icon = imageSrc(card.icon);
          return (
            <div
              key={index}
              className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-7"
            >
              {icon && (
                // Same green circle as the application cards: the built-in icons are white line
                // art drawn for it, and an uploaded icon reads well on it too.
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full shadow-md"
                  style={{ background: 'linear-gradient(135deg, #6fae44 0%, #3f7f34 55%, #1e5a30 100%)' }}
                >
                  <img src={icon} alt="" className="h-8 w-8 object-contain" />
                </div>
              )}
              {card.title && (
                <h3
                  className="text-lg font-bold leading-snug"
                  style={{ fontFamily: 'var(--hp-font-latin)', color: color(layout.textColor, 'var(--hp-text)') }}
                >
                  {card.title}
                </h3>
              )}
              {card.text && (
                <p
                  className="mt-2 whitespace-pre-line text-sm leading-relaxed"
                  style={{ fontFamily: 'var(--hp-font-body)', color: 'var(--hp-muted)' }}
                >
                  {card.text}
                </p>
              )}
              {card.buttonLabel && (
                <div className="mt-auto pt-5">
                  <SmartLink
                    to={card.link}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--hp-primary)] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[var(--hp-primary-hover)]"
                    style={{ fontFamily: 'var(--hp-font-latin)' }}
                  >
                    {card.buttonLabel}
                    <ArrowRight className="h-4 w-4" />
                  </SmartLink>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
};

export const GalleryBlock = ({ section }) => {
  const { layout, content } = section;
  const items = (Array.isArray(content.items) ? content.items : []).filter((item) => imageSrc(item.image));

  return (
    <SectionShell section={section} defaultWidth="wide">
      <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${GRID[content.columns] || GRID[3]}`}>
        {items.map((item, index) => (
          <figure key={index} className="group overflow-hidden rounded-xl bg-gray-100 shadow-md">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={imageSrc(item.image)}
                alt={item.caption || ''}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            {item.caption && (
              <figcaption
                className="bg-white px-3 py-2 text-xs sm:text-sm"
                style={{ fontFamily: 'var(--hp-font-body)', color: color(layout.textColor, 'var(--hp-text)') }}
              >
                {item.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </SectionShell>
  );
};

export const VideoBlock = ({ section }) => {
  const embed = youtubeEmbed(section.content.videoUrl);

  return (
    <SectionShell section={section}>
      <div className="mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-2xl bg-gray-900 shadow-xl">
        {embed ? (
          <iframe
            src={embed}
            title={section.content.heading || 'Video'}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-400">
            <CirclePlay className="h-10 w-10" strokeWidth={1.25} />
            Paste a YouTube link to show the video.
          </div>
        )}
      </div>
    </SectionShell>
  );
};

export const FaqBlock = ({ section }) => {
  const { layout, content } = section;
  const items = (Array.isArray(content.items) ? content.items : []).filter((item) => item.question);

  return (
    <SectionShell section={section} defaultWidth="narrow">
      <div className="space-y-3 text-left">
        {items.map((item, index) => (
          <details
            key={index}
            className="group rounded-xl border border-gray-200 bg-white shadow-sm open:shadow-md"
          >
            <summary
              className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-semibold [&::-webkit-details-marker]:hidden"
              style={{ fontFamily: 'var(--hp-font-body)', color: color(layout.textColor, 'var(--hp-text)') }}
            >
              {item.question}
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            {item.answer && (
              <p
                className="whitespace-pre-line px-5 pb-4 text-sm leading-relaxed"
                style={{ fontFamily: 'var(--hp-font-body)', color: 'var(--hp-muted)' }}
              >
                {item.answer}
              </p>
            )}
          </details>
        ))}
      </div>
    </SectionShell>
  );
};
