import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchBanners } from '../lib/banners';

/**
 * The banner strip on the home page, between അപേക്ഷകൾ and the About section.
 *
 * Renders nothing when there are no enabled banners or the request fails — like the
 * publications strip it is promotional, and an empty frame is worse than no section.
 */

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const BannerImage = ({ banner, eager }) => (
  <picture>
    {banner.mobileImage?.url && <source media="(max-width: 639px)" srcSet={banner.mobileImage.url} />}
    <img
      src={banner.image.url}
      alt={banner.title}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className="block h-auto w-full select-none"
    />
  </picture>
);

// The API already refuses anything else, but a record written around it must still never
// reach an href as a javascript: URL.
const isSiteLink = (link) => link.startsWith('/') && !link.startsWith('//');
const isWebLink = (link) => /^https?:\/\//i.test(link);

// Site paths go through the router so the click does not reload the app.
const BannerLink = ({ banner, children }) => {
  const link = String(banner.linkUrl || '').trim();
  if (!isSiteLink(link) && !isWebLink(link)) return children;
  if (isSiteLink(link)) {
    return (
      <Link to={link} className="block focus-visible:outline-2 focus-visible:outline-green-600">
        {children}
      </Link>
    );
  }
  return (
    <a
      href={link}
      target={banner.openInNewTab ? '_blank' : undefined}
      rel={banner.openInNewTab ? 'noopener noreferrer' : undefined}
      className="block focus-visible:outline-2 focus-visible:outline-green-600"
    >
      {children}
    </a>
  );
};

const BannerCarousel = () => {
  const [banners, setBanners] = useState(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    let active = true;
    fetchBanners()
      .then((data) => active && setBanners(Array.isArray(data) ? data : []))
      .catch(() => active && setBanners([]));
    return () => {
      active = false;
    };
  }, []);

  const count = banners?.length || 0;

  useEffect(() => {
    if (count < 2 || paused || prefersReducedMotion()) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  if (banners === null) {
    return (
      <section aria-hidden="true" className="bg-white px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto aspect-[4/1] max-w-7xl animate-pulse rounded-2xl bg-gray-100" />
      </section>
    );
  }
  if (count === 0) return null;

  const go = (next) => setIndex((next + count) % count);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    setPaused(false);
    if (start == null) return;
    const delta = e.changedTouches[0].clientX - start;
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) go(index + (delta < 0 ? 1 : -1));
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Announcements"
      className="bg-white px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl shadow-lg ring-1 ring-gray-100"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex items-start transition-transform duration-700 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((banner, i) => (
            <div
              key={banner._id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
              inert={i !== index}
              className="w-full shrink-0"
            >
              <BannerLink banner={banner}>
                <BannerImage banner={banner} eager={i === 0} />
              </BannerLink>
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous banner"
              className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-md backdrop-blur transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-green-600 sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next banner"
              className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-md backdrop-blur transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-green-600 sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex justify-center gap-1">
          {banners.map((banner, i) => (
            <button
              key={banner._id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show banner ${i + 1}`}
              aria-current={i === index}
              className="flex h-6 min-w-6 items-center justify-center focus-visible:outline-2 focus-visible:outline-green-600"
            >
              <span
                className={`block h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-[#1F6B3A]' : 'w-2 bg-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default BannerCarousel;
