import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, List } from 'lucide-react';
import { fetchPublication, fetchPublicationChapter } from '../lib/publications';

/**
 * Reader for one publication: /resources/:slug/:chapterSlug
 *
 * Desktop puts the chapter list in a sticky rail; on phones it collapses into a dropdown
 * pinned above the text. Bare /resources/:slug redirects to the first chapter so every
 * chapter a reader lands on has its own shareable URL.
 *
 * The book arrives without its chapter bodies; the open chapter's body is a second request,
 * cached per chapter for the rest of the visit, and the next chapter is prefetched once the
 * current one is on screen so paging forward is instant.
 *
 * Chapter bodies are sanitized server-side on write (lib/sanitizeRichText.js). That is the
 * control that matters, and it is the one with tests. DOMPurify runs again here as a second
 * layer, because the write path is not the only way HTML can reach this document — a future
 * route that forgets to sanitize, or anything written straight into Mongo, would otherwise
 * render unchecked.
 */

const ReaderShell = ({ children }) => (
  <div className="min-h-screen bg-[#f7faf6]">
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">{children}</div>
  </div>
);

const LoadingState = () => (
  <ReaderShell>
    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
    <div className="mt-5 h-8 w-2/3 animate-pulse rounded bg-gray-200" />
    <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="mc-card-shadow hidden h-fit space-y-2 rounded-2xl bg-white p-4 lg:block">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
      <div className="mc-card-shadow space-y-3 rounded-2xl bg-white p-6 sm:p-8">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    </div>
  </ReaderShell>
);

const NotFoundState = ({ message }) => (
  <ReaderShell>
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
      <BookOpen className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.5} />
      <h1 className="mt-4 text-lg font-bold text-gray-900">ഈ പ്രസിദ്ധീകരണം കണ്ടെത്താനായില്ല</h1>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
      >
        <ArrowLeft className="h-4 w-4" />
        ഹോം പേജിലേക്ക്
      </Link>
    </div>
  </ReaderShell>
);

const ChapterList = ({ chapters, activeSlug, publicationSlug, onNavigate }) => (
  // Rows are separated by the soft shadow rule defined for .mc-toc in index.css; the per-row
  // padding keeps that rule clear of the active pill so the two never touch.
  <ol className="mc-toc">
    {chapters.map((chapter, index) => {
      const active = chapter.slug === activeSlug;
      return (
        <li key={chapter.slug} className="relative py-1 first:pt-0 last:pb-0">
          <Link
            to={`/resources/${publicationSlug}/${chapter.slug}`}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`group flex gap-2.5 rounded-lg px-3 py-2 text-sm leading-snug transition-all duration-150 ${
              active
                ? 'bg-[#EAF6EF] font-semibold text-[#1F6B3A] shadow-[inset_3px_0_0_0_#1F6B3A]'
                : 'text-gray-600 hover:translate-x-0.5 hover:bg-green-50 hover:text-green-900'
            }`}
            style={{ fontFamily: 'Noto Sans Malayalam' }}
          >
            <span
              className={`shrink-0 tabular-nums transition-colors ${
                active ? 'text-[#1F6B3A]' : 'text-gray-400 group-hover:text-green-700'
              }`}
            >
              {index + 1}.
            </span>
            <span className="min-w-0">{chapter.title}</span>
          </Link>
        </li>
      );
    })}
  </ol>
);

const PublicationReader = () => {
  const { slug, chapterSlug } = useParams();
  const navigate = useNavigate();

  const [publication, setPublication] = useState(null);
  const [body, setBody] = useState(null);
  const [error, setError] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const articleRef = useRef(null);

  useEffect(() => {
    let active = true;
    setPublication(null);
    setError('');
    fetchPublication(slug)
      .then((data) => active && setPublication(data))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [slug]);

  const chapters = useMemo(
    () => [...(publication?.chapters || [])].sort((a, b) => a.order - b.order),
    [publication]
  );

  const activeIndex = chapterSlug ? chapters.findIndex((c) => c.slug === chapterSlug) : 0;
  const chapter = chapters[activeIndex] || null;

  // The open chapter's body, then a prefetch of the next one so paging forward reads from
  // the cache. `active` guards a fast click through several chapters: only the response for
  // the chapter still on screen is allowed to set state.
  useEffect(() => {
    if (!publication || !chapter) return;
    let active = true;
    setBody(null);
    fetchPublicationChapter(publication.slug, chapter.slug)
      .then((data) => {
        if (!active) return;
        setBody(data.bodyHtml || '');
        const next = chapters[activeIndex + 1];
        if (next) fetchPublicationChapter(publication.slug, next.slug).catch(() => {});
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [publication, chapter, chapters, activeIndex]);

  // Second sanitising pass — see the note at the top of the file. Memoised so a chapter's
  // body is only re-purified when the chapter actually changes.
  const safeBody = useMemo(
    () => (body ? DOMPurify.sanitize(body, { ADD_ATTR: ['target'] }) : ''),
    [body]
  );

  // A bare /resources/:slug — or a chapter slug that no longer exists after an edit —
  // lands on the first chapter rather than an empty page.
  useEffect(() => {
    if (!chapters.length) return;
    if (!chapterSlug || activeIndex === -1) {
      navigate(`/resources/${slug}/${chapters[0].slug}`, { replace: true });
    }
  }, [chapters, chapterSlug, activeIndex, slug, navigate]);

  // Moving between chapters should start at the top of the new one. Arriving at one must not
  // scroll at all — and "arriving" includes the redirect from a bare /resources/:slug, which
  // changes chapterSlug from undefined to the first chapter. Comparing against the previous
  // slug distinguishes that from a real chapter change; a plain first-render flag does not.
  const previousChapterSlug = useRef(chapterSlug);
  useEffect(() => {
    const cameFrom = previousChapterSlug.current;
    previousChapterSlug.current = chapterSlug;
    if (!cameFrom || cameFrom === chapterSlug) return;
    articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [chapterSlug]);

  if (error) return <NotFoundState message={error} />;
  if (!publication) return <LoadingState />;
  if (!chapters.length) {
    return <NotFoundState message="ഈ പ്രസിദ്ധീകരണത്തിൽ അധ്യായങ്ങളൊന്നും ചേർത്തിട്ടില്ല." />;
  }
  if (!chapter) return <LoadingState />;

  const previous = activeIndex > 0 ? chapters[activeIndex - 1] : null;
  const next = activeIndex < chapters.length - 1 ? chapters[activeIndex + 1] : null;

  return (
    <ReaderShell>
      <Link
        to="/#publications-section"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-green-800"
      >
        <ArrowLeft className="h-4 w-4" />
        <span style={{ fontFamily: 'Noto Sans Malayalam' }}>പ്രസിദ്ധീകരണങ്ങൾ</span>
      </Link>

      <header className="mt-4 border-b border-gray-200 pb-6">
        <h1
          className="text-2xl font-bold leading-tight text-green-900 sm:text-3xl"
          style={{ fontFamily: 'var(--font-ml-title)' }}
        >
          {publication.titleMalayalam || publication.title}
        </h1>
        {publication.subtitle && (
          <p className="mt-1.5 text-sm text-green-800" style={{ fontFamily: 'Noto Sans Malayalam' }}>
            {publication.subtitle}
          </p>
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-10">
        {/* Mobile: the chapter list folds into a dropdown so it never buries the text. */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setTocOpen((open) => !open)}
            aria-expanded={tocOpen}
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <List className="h-4 w-4 shrink-0 text-green-700" />
              <span
                className="truncate text-sm font-semibold text-gray-900"
                style={{ fontFamily: 'Noto Sans Malayalam' }}
              >
                {activeIndex + 1}. {chapter.title}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${tocOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {tocOpen && (
            <div className="mc-card-shadow mt-2 max-h-80 overflow-y-auto rounded-xl bg-white p-2">
              <ChapterList
                chapters={chapters}
                activeSlug={chapter.slug}
                publicationSlug={publication.slug}
                onNavigate={() => setTocOpen(false)}
              />
            </div>
          )}
        </div>

        <nav aria-label="അധ്യായങ്ങൾ" className="hidden lg:block">
          {/* Card matches the article panel opposite it so the two columns read as a pair. The
              header stays put while only the chapter list scrolls. */}
          <div className="mc-card-shadow mc-card-shadow-hover sticky top-24 flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl bg-white transition-shadow duration-200">
            <p className="border-b border-gray-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Chapters
            </p>
            <div className="overflow-y-auto p-2">
              <ChapterList
                chapters={chapters}
                activeSlug={chapter.slug}
                publicationSlug={publication.slug}
              />
            </div>
          </div>
        </nav>

        <article ref={articleRef} className="scroll-mt-24">
          <div className="mc-card-shadow rounded-2xl bg-white p-5 sm:p-8 lg:p-10">
            <h2
              className="mb-6 text-xl font-bold leading-snug text-green-900 sm:text-2xl"
              style={{ fontFamily: 'var(--font-ml-title)' }}
            >
              {chapter.title}
            </h2>
            {body === null ? (
              <div className="space-y-3" aria-busy="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
                ))}
              </div>
            ) : (
              <div className="mc-prose" dangerouslySetInnerHTML={{ __html: safeBody }} />
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            {previous ? (
              <Link
                to={`/resources/${publication.slug}/${previous.slug}`}
                className="flex min-h-11 flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-green-300 hover:bg-green-50"
              >
                <ArrowLeft className="h-4 w-4 shrink-0 text-green-700" />
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-gray-400">
                    മുൻപത്തേത്
                  </span>
                  <span
                    className="block truncate text-sm font-medium text-gray-800"
                    style={{ fontFamily: 'Noto Sans Malayalam' }}
                  >
                    {previous.title}
                  </span>
                </span>
              </Link>
            ) : (
              <span className="hidden flex-1 sm:block" />
            )}

            {next && (
              <Link
                to={`/resources/${publication.slug}/${next.slug}`}
                className="flex min-h-11 flex-1 items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-right transition-colors hover:border-green-300 hover:bg-green-50"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-gray-400">
                    അടുത്തത്
                  </span>
                  <span
                    className="block truncate text-sm font-medium text-gray-800"
                    style={{ fontFamily: 'Noto Sans Malayalam' }}
                  >
                    {next.title}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-green-700" />
              </Link>
            )}
          </div>
        </article>
      </div>
    </ReaderShell>
  );
};

export default PublicationReader;
