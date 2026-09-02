import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * BrowserRouter carries the window scroll position across client-side navigations. Opening a
 * page from halfway down another one — a publication card sits well down the home page — then
 * lands the reader in the middle of the new page instead of at its title.
 *
 * So: every pushed or replaced location starts at the top, a location with a hash starts at its
 * target, and back/forward (POP) is left alone so the browser can restore where the reader was.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'POP') return undefined;

    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }

    // The target can still be missing on the first frame — the home page's sections fetch their
    // content — so look for it over a short run of frames before giving up.
    let frames = 0;
    let raf = 0;
    const scrollToTarget = () => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (frames++ < 60) raf = requestAnimationFrame(scrollToTarget);
    };
    scrollToTarget();
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash, navigationType]);

  return null;
};

export default ScrollToTop;
