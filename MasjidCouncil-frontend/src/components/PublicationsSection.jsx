import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Layers } from 'lucide-react';
import { fetchPublications, fetchPublicationSection } from '../lib/publications';

/**
 * The publications strip on the home page, above അപേക്ഷകൾ.
 *
 * Renders nothing at all when the section is switched off, when nothing is published, or
 * when the request fails — it is decorative, and a broken heading with no cards under it is
 * worse for a visitor than no section.
 */

// Desktop keeps every card on one row: the column count comes from the data. Past five the
// cards would be too narrow to read a Malayalam title in, so it wraps instead.
const MAX_COLUMNS_IN_ONE_ROW = 5;

const CardSkeleton = () => (
  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
    <div className="mb-4 h-14 w-14 animate-pulse rounded-full bg-gray-200" />
    <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
    <div className="mb-4 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
    <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
  </div>
);

/**
 * Every card emits the same six blocks in the same order — icon, title, subtitle,
 * description, chapter count, button — even when a book has no subtitle. The empty ones still
 * occupy their row, which is what lets .mc-pub-card line all six up across the strip via
 * subgrid. Dropping an absent block instead would shift every row below it out of step, which
 * is exactly what made the chapter counts sit at two different heights.
 */
const PublicationCard = ({ publication, ctaLabel }) => (
  <Link
    to={`/resources/${publication.slug}`}
    className="mc-pub-card group rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/40 sm:p-7"
  >
    <span className="mc-pub-figure">
      {publication.coverImage?.url ? (
        <img
          src={publication.coverImage.url}
          alt=""
          loading="lazy"
          className="mx-auto h-32 w-auto max-w-full rounded-lg object-contain shadow-md sm:h-36"
        />
      ) : (
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full shadow-md"
          style={{ background: 'linear-gradient(135deg, #6fae44 0%, #3f7f34 55%, #1e5a30 100%)' }}
        >
          <BookOpen className="h-7 w-7 text-white" strokeWidth={1.5} />
        </span>
      )}
    </span>

    <h3
      className="text-base font-bold leading-snug text-gray-900 sm:text-lg"
      style={{ fontFamily: 'var(--font-ml-title)' }}
    >
      {publication.titleMalayalam || publication.title}
    </h3>

    <p className="text-sm text-green-800" style={{ fontFamily: 'Noto Sans Malayalam' }}>
      {publication.subtitle}
    </p>

    <p
      className="line-clamp-4 text-sm leading-relaxed text-gray-500"
      style={{ fontFamily: 'Noto Sans Malayalam' }}
    >
      {publication.description}
    </p>

    <p className="inline-flex items-center justify-center gap-1.5 text-xs text-gray-400">
      {publication.chapterCount > 0 && (
        <>
          <Layers className="h-3.5 w-3.5" />
          {publication.chapterCount} അധ്യായങ്ങൾ
        </>
      )}
    </p>

    <span
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:brightness-95"
      style={{ background: 'linear-gradient(135deg, #6fae44 0%, #3f7f34 55%, #1e5a30 100%)' }}
    >
      <span style={{ fontFamily: 'Noto Sans Malayalam' }}>{ctaLabel}</span>
      <ArrowRight className="h-4 w-4" />
    </span>
  </Link>
);

const PublicationsSection = () => {
  const [section, setSection] = useState(null);
  const [publications, setPublications] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([fetchPublicationSection(), fetchPublications()])
      .then(([sectionData, list]) => {
        if (!active) return;
        setSection(sectionData);
        setPublications(list);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  if (failed) return null;
  if (section && section.enabled === false) return null;
  if (publications && publications.length === 0) return null;

  const loading = publications === null;
  const columns = Math.min(publications?.length || 3, MAX_COLUMNS_IN_ONE_ROW);
  const ctaLabel = section?.ctaLabel || 'വായിക്കുക';
  const heading = (section?.heading || '').trim();
  const subtitle = (section?.subtitle || '').trim();

  return (
    <div id="publications-section" className="bg-white px-4 py-7 sm:py-10">
      {/* Heading and subtitle are both optional copy. Left blank in the admin screen they are
          not rendered at all — no placeholder text, and no reserved gap above the cards. */}
      {heading && (
        <h2
          className="relative mb-2 text-center text-2xl font-bold leading-tight text-green-900 sm:text-3xl md:text-4xl"
          style={{ fontFamily: 'var(--font-ml-title)' }}
        >
          {heading}
          <div
            className="absolute bottom-0 left-1/2 h-0.5 w-24 -translate-x-1/2 transform"
            style={{ backgroundColor: '#9ece88' }}
          />
        </h2>
      )}

      {subtitle && (
        <p
          className="mx-auto max-w-2xl text-center text-sm text-gray-500"
          style={{ fontFamily: 'var(--font-ml-body)' }}
        >
          {subtitle}
        </p>
      )}

      {(heading || subtitle) && <div className="mb-6 sm:mb-8" />}

      {/* Phones scroll sideways so the section stays short; from sm up every card sits on a
          single row, with the column count taken from the data (see .mc-pub-grid). */}
      <div
        className="mc-pub-grid mx-auto max-w-6xl"
        style={{
          '--mc-pub-cols': columns,
          // Five cards at tablet width would be unreadably narrow, so the middle breakpoint
          // tops out at two and only lg opens up to the full row.
          '--mc-pub-cols-sm': Math.min(columns, 2),
        }}
      >
        {loading
          ? Array.from({ length: 2 }, (_, i) => <CardSkeleton key={i} />)
          : publications.map((publication) => (
              <PublicationCard
                key={publication.slug}
                publication={publication}
                ctaLabel={ctaLabel}
              />
            ))}
      </div>
    </div>
  );
};

export default PublicationsSection;
