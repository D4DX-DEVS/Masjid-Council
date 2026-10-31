import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import HomeSections from '../components/home/HomeSections';
import Home from './Home';
import { mergeHomepage } from '../lib/homepage/defaults';
import { PREVIEW_MESSAGES } from '../lib/homepage/preview';
import { capturePositions, playFlip, prefersReducedMotion } from '../lib/homepage/flip';

const FLASH_MS = 1400;

// Hovering a section outlines it and names it, so the admin knows a click opens its settings.
// Both ease in rather than snapping on as the pointer crosses section edges.
const EDITABLE_STYLES = `
  [data-hp-label] {
    cursor: pointer;
    outline: 2px dashed transparent; outline-offset: -2px;
    transition: outline-color 0.18s ease-out;
  }
  [data-hp-label]:hover { outline-color: #22c55e; }
  [data-hp-label]::after {
    content: attr(data-hp-label);
    position: absolute; top: 8px; left: 8px; z-index: 40;
    padding: 4px 10px; border-radius: 9999px;
    background: #15803d; color: #fff;
    font: 600 12px/1.4 Poppins, system-ui, sans-serif;
    pointer-events: none;
    opacity: 0; transform: translateY(-4px);
    transition: opacity 0.18s ease-out, transform 0.18s ease-out;
  }
  [data-hp-label]:hover::after { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) {
    [data-hp-label], [data-hp-label]::after { transition: none; }
  }
`;

const visibleOrder = (config) =>
  config.sections
    .filter((s) => s.visible !== false)
    .map((s) => s.id)
    .join(',');

// Highlights the section the editor just opened, then lets the highlight fade away.
const flash = (node) => {
  if (typeof node.animate !== 'function') return;
  const on = { outline: '3px solid rgba(34, 197, 94, 1)', outlineOffset: '-3px' };
  const off = { outline: '3px solid rgba(34, 197, 94, 0)', outlineOffset: '-3px' };
  node.animate([{ ...on, offset: 0 }, { ...on, offset: 0.35 }, { ...off, offset: 1 }], {
    duration: prefersReducedMotion() ? 600 : FLASH_MS,
    easing: 'ease-out',
  });
};

/**
 * The frame inside the Homepage Design editor. It renders whatever draft the parent window
 * posts — accepted only from the parent, on this site's own origin — and blocks navigation,
 * so a click on a link in the preview does not leave the preview.
 *
 * Opened directly rather than inside the editor it just shows the published home page.
 */
const HomepagePreview = () => {
  const embedded = window.parent !== window;
  const [config, setConfig] = useState(null);
  const containerRef = useRef(null);
  const orderRef = useRef('');
  const flipFrom = useRef(null);
  // A focus request for a section that is not on the page yet (it was just added and its
  // config is still on the way) waits here until the next render brings it.
  const pendingFocus = useRef(null);

  const scrollTo = (id) => {
    const node = document.querySelector(`[data-hp-section="${CSS.escape(id)}"]`);
    if (!node) return false;
    node.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    flash(node);
    return true;
  };

  // Sections moved or shown since the last draft glide from where they were. Only order and
  // visibility changes animate; a content edit that changes a section's height must not set
  // everything below it sliding on every keystroke.
  useLayoutEffect(() => {
    if (flipFrom.current) {
      playFlip(containerRef.current, 'data-hp-section', flipFrom.current);
      flipFrom.current = null;
    }
    if (pendingFocus.current && scrollTo(pendingFocus.current)) pendingFocus.current = null;
  }, [config]);

  useEffect(() => {
    if (!embedded) return undefined;

    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const { type } = event.data || {};
      if (type === PREVIEW_MESSAGES.config) {
        const next = mergeHomepage(event.data.config);
        const order = visibleOrder(next);
        if (orderRef.current && order !== orderRef.current) {
          flipFrom.current = capturePositions(containerRef.current, 'data-hp-section');
        }
        orderRef.current = order;
        setConfig(next);
      } else if (type === PREVIEW_MESSAGES.focus && typeof event.data.id === 'string') {
        pendingFocus.current = scrollTo(event.data.id) ? null : event.data.id;
      }
    };

    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: PREVIEW_MESSAGES.ready }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, [embedded]);

  if (!embedded) {
    return (
      <>
        <Navbar />
        <Home />
      </>
    );
  }

  // Capture phase, so this runs before any link's or the navbar's own click handler. A click
  // on a section also tells the editor to open that section's settings.
  const onClickCapture = (event) => {
    if (event.target.closest('[data-hp-nav]')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.target.closest('a')) event.preventDefault();
    const section = event.target.closest('[data-hp-section]');
    if (section) {
      window.parent.postMessage(
        { type: PREVIEW_MESSAGES.select, id: section.dataset.hpSection },
        window.location.origin
      );
    }
  };

  return (
    <div onClickCapture={onClickCapture}>
      <style>{EDITABLE_STYLES}</style>
      {/* display: contents keeps the navbar's sticky positioning working inside the wrapper. */}
      <div data-hp-nav className="contents">
        <Navbar />
      </div>
      {config ? (
        <div ref={containerRef}>
          <HomeSections config={config} editable />
        </div>
      ) : (
        <div className="h-[440px] sm:h-auto sm:aspect-[1751/826] bg-[#186b3a] animate-pulse" />
      )}
    </div>
  );
};

export default HomepagePreview;
