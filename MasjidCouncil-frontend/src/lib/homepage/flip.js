/**
 * FLIP animation for reordered lists: record where each keyed element sits, let React move
 * them, then play each one from its old spot to its new one. Used for the section list in
 * the editor and for the sections inside the preview, so a moved section glides instead of
 * jumping.
 *
 * Positions are offsets within the container rather than viewport rects, so scrolling between
 * capture and play does not throw the deltas off.
 */

const DURATION_MS = 320;
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** @returns {Map<string, number>} key → offsetTop */
export const capturePositions = (container, keyAttr) => {
  const positions = new Map();
  if (!container) return positions;
  for (const el of container.querySelectorAll(`[${keyAttr}]`)) {
    positions.set(el.getAttribute(keyAttr), el.offsetTop);
  }
  return positions;
};

/**
 * Animates every keyed element from its captured position to where it is now. Elements that
 * were not there before (a section just shown again) fade up into place instead.
 */
export const playFlip = (container, keyAttr, before) => {
  if (!container || !before || prefersReducedMotion()) return;
  for (const el of container.querySelectorAll(`[${keyAttr}]`)) {
    if (typeof el.animate !== 'function') return;
    const key = el.getAttribute(keyAttr);
    if (!before.has(key)) {
      el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], {
        duration: DURATION_MS,
        easing: EASING,
      });
      continue;
    }
    const delta = before.get(key) - el.offsetTop;
    if (Math.abs(delta) < 1) continue;
    el.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], {
      duration: DURATION_MS,
      easing: EASING,
    });
  }
};
