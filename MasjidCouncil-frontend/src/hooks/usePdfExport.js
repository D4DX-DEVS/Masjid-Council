import { useRef, useState } from 'react';
// html2canvas-pro: fork with oklch()/color-mix() support — Tailwind v4 palette
// colors crash original html2canvas ("unsupported color function oklch").
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

// Page margin in mm. Without it the capture is drawn edge to edge and the letterhead
// logo / date sit flush against the paper edge (and get clipped by printers).
const MARGIN = 10;
// A block this short is kept whole (CSS px): a label and its value, a table row.
// Taller than this and the block is allowed to break, or a long list would push
// most of a page's worth of whitespace ahead of it.
const KEEP_WHOLE_MAX = 160;
// How far a heading may drag its following block onto the next page (CSS px).
const KEEP_WITH_NEXT_MAX = 260;

/**
 * Records the vertical span of every block that must not be cut in half.
 *
 * Measured on the CLONE html2canvas renders, not the live DOM: the letterhead is
 * display:none on screen and revealed only in the clone, so live coordinates are
 * offset from the canvas by its height and every cut lands in the wrong place.
 */
function collectRanges(clonedRoot) {
  const rootTop = clonedRoot.getBoundingClientRect().top;
  const ranges = [];
  clonedRoot.querySelectorAll('*').forEach((el) => {
    if (el.classList?.contains('pdf-hide')) return;
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0) return;
    const isLeaf = !Array.from(el.children).some((c) => c.getBoundingClientRect().height > 0);
    if (!isLeaf && rect.height > KEEP_WHOLE_MAX) return;
    ranges.push([rect.top - rootTop, rect.bottom - rootTop]);

    // Keep a section heading with what follows it, so a page never ends on a
    // heading whose fields start on the next one.
    if (/^H[1-4]$/.test(el.tagName)) {
      const next = el.nextElementSibling;
      const nextRect = next?.getBoundingClientRect();
      if (nextRect && nextRect.height > 0 && nextRect.bottom - rect.top < KEEP_WITH_NEXT_MAX) {
        ranges.push([rect.top - rootTop, nextRect.bottom - rootTop]);
      }
    }
  });
  return ranges;
}

// ponytail: image-snapshot PDF (html2canvas) — sidesteps embedding a Malayalam font
// into jsPDF; output isn't selectable text but every section renders correctly.
// Elements with the "pdf-hide" class (e.g. action buttons) are skipped in the capture.
export function usePdfExport(filenamePrefix) {
  const contentRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (idSuffix, onError) => {
    if (!contentRef.current) return;
    setDownloading(true);
    try {
      // Filled during onclone, in the clone's CSS pixels.
      let ranges = [];
      let clonedHeight = 0;

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => el.classList?.contains('pdf-hide'),
        // letterhead is print-only on screen; reveal it in the capture clone
        onclone: (doc, clonedRoot) => {
          doc.querySelectorAll('.print-only').forEach((el) => { el.style.display = 'block'; });
          const root = clonedRoot || doc.body;
          clonedHeight = root.getBoundingClientRect().height;
          ranges = collectRanges(root);
        },
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - MARGIN * 2;
      const pxPerMm = canvas.width / imgWidth;
      const usablePx = (pageHeight - MARGIN * 2) * pxPerMm;

      // Clone CSS px -> canvas px. Taken from the heights so it holds whatever
      // html2canvas did with device pixel ratio or the revealed letterhead.
      const scale = clonedHeight > 0 ? canvas.height / clonedHeight : 1;
      const blocks = ranges
        .map(([top, bottom]) => [top * scale, bottom * scale])
        .filter(([top, bottom]) => bottom - top < usablePx && bottom > 0)
        .sort((a, b) => a[0] - b[0]);

      // Cut at the page limit, then walk the cut up out of every block it crosses.
      const nextCut = (start) => {
        const limit = start + usablePx;
        if (limit >= canvas.height - 1) return canvas.height;
        let cut = limit;
        for (let guard = 0; guard < blocks.length + 1; guard += 1) {
          const crossed = blocks.find(([top, bottom]) => top < cut - 0.5 && cut < bottom - 0.5);
          if (!crossed) break;
          cut = crossed[0];
        }
        // No progress means one block fills the page — hard-cut rather than loop forever.
        return cut > start + 1 ? cut : limit;
      };

      const slice = document.createElement('canvas');
      const ctx = slice.getContext('2d');
      let y = 0;
      let firstPage = true;
      while (y < canvas.height - 1) {
        const end = nextCut(y);
        const height = Math.max(1, Math.round(end - y));
        slice.width = canvas.width;
        slice.height = height;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, height);
        ctx.drawImage(canvas, 0, y, canvas.width, height, 0, 0, canvas.width, height);

        if (!firstPage) pdf.addPage();
        // Every page starts at MARGIN, so pages 2+ get the same top gap as page 1.
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', MARGIN, MARGIN, imgWidth, height / pxPerMm);
        firstPage = false;
        y = end;
      }

      pdf.save(`${filenamePrefix}-${idSuffix || 'application'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      onError?.(err);
    } finally {
      setDownloading(false);
    }
  };

  return { contentRef, downloading, handleDownload };
}
