import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => el.classList?.contains('pdf-hide'),
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/png');

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
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
