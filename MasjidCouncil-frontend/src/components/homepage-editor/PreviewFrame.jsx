import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PREVIEW_MESSAGES } from '../../lib/homepage/preview';

// Typing or dragging a colour picker fires a change per keystroke or pixel. Updates are
// throttled rather than debounced: the frame repaints at most this often *while* the admin
// drags, instead of waiting for them to stop, and the last value always lands.
const POST_INTERVAL_MS = 60;
// After a device switch the frame is hidden for this long, then fades back in at the new width.
const RESIZE_HOLD_MS = 60;
const RESIZE_FADE_MS = 220;

/**
 * The real home page in an iframe, rendering the unsaved draft.
 *
 * The frame loads /homepage-preview, which says when it is ready; from then on every draft
 * change is posted to it, and a click on a section in the frame comes back as onSelect.
 * Messages carry this page's own origin both ways, so nothing else can feed the preview a
 * config or pick a section.
 *
 * The page is drawn at the device's real width and scaled down only if it does not fit, so
 * breakpoints behave as they will on that device. With fillWidth ("Desktop") it uses the
 * whole available width when that is wider, which is what a visitor on a large screen sees.
 */
const PreviewFrame = ({ config, focus, deviceWidth, fillWidth, onSelect }) => {
  const frameRef = useRef(null);
  const boxRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [resizing, setResizing] = useState(false);
  const lastPost = useRef(0);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const post = (message) => frameRef.current?.contentWindow?.postMessage(message, window.location.origin);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const { type, id } = event.data || {};
      if (type === PREVIEW_MESSAGES.ready) setReady(true);
      if (type === PREVIEW_MESSAGES.select && typeof id === 'string') onSelectRef.current?.(id);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const send = () => {
      lastPost.current = Date.now();
      post({ type: PREVIEW_MESSAGES.config, config });
    };
    const wait = POST_INTERVAL_MS - (Date.now() - lastPost.current);
    if (wait <= 0) {
      send();
      return undefined;
    }
    const timer = setTimeout(send, wait);
    return () => clearTimeout(timer);
  }, [config, ready]);

  // A device switch re-lays the whole page out at a new width. A layout effect hides the frame
  // before that first frame is painted, so the jump is never seen; it then fades back in.
  const firstDevice = useRef(true);
  useLayoutEffect(() => {
    if (firstDevice.current) {
      firstDevice.current = false;
      return undefined;
    }
    setResizing(true);
    const timer = setTimeout(() => setResizing(false), RESIZE_HOLD_MS);
    return () => clearTimeout(timer);
  }, [deviceWidth, fillWidth]);

  // `focus` is "<section id>:<timestamp>", so picking the same section again still scrolls to it.
  useEffect(() => {
    if (ready && focus) post({ type: PREVIEW_MESSAGES.focus, id: focus.split(':')[0] });
  }, [focus, ready]);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const width = fillWidth ? Math.max(deviceWidth, Math.floor(box.width)) : deviceWidth;
  const scale = box.width ? Math.min(1, box.width / width) : 1;
  const framed = width * scale < box.width - 1;

  return (
    <div ref={boxRef} className="relative h-full w-full overflow-hidden bg-gray-100">
      <div
        className={`mx-auto h-full ${
          framed ? 'shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_8px_30px_-12px_rgba(0,0,0,0.25)]' : ''
        }`}
        style={{ width: width * scale }}
      >
        <iframe
          ref={frameRef}
          src="/homepage-preview"
          title="Home page preview"
          style={{
            width,
            height: box.height / scale || '100%',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            border: 0,
            background: '#fff',
            display: 'block',
            opacity: resizing ? 0 : 1,
            transition: resizing ? 'none' : `opacity ${RESIZE_FADE_MS}ms ease-out`,
          }}
        />
      </div>
      <div
        aria-hidden={ready}
        className={`absolute inset-0 flex items-center justify-center bg-gray-100 text-sm text-gray-500 transition-opacity duration-300 ${
          ready ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        Loading preview…
      </div>
    </div>
  );
};

export default PreviewFrame;
