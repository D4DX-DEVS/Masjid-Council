import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Windowed page list: 1 … 6 [7] 8 … 26 — never renders every page number.
const buildPages = (page, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push('…');
  pages.push(totalPages);

  return pages;
};

const Pagination = ({ page, totalItems, pageSize, onChange }) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const go = (p) => onChange(Math.min(Math.max(p, 1), totalPages));

  const arrow =
    'inline-flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 text-gray-600 ' +
    'hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors';

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center sm:flex-row sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-white"
    >
      <p className="text-xs sm:text-sm text-gray-500">
        <span className="font-medium text-gray-900">{from}–{to}</span> of{' '}
        <span className="font-medium text-gray-900">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button onClick={() => go(page - 1)} disabled={page === 1} className={arrow} aria-label="Previous page">
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Compact on phones — the number strip is what used to overflow the card */}
        <span className="sm:hidden px-3 text-sm text-gray-600">
          {page} / {totalPages}
        </span>

        <div className="hidden sm:flex items-center gap-1.5">
          {buildPages(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="w-9 text-center text-gray-400 select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => go(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`h-9 min-w-9 px-2 rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button onClick={() => go(page + 1)} disabled={page === totalPages} className={arrow} aria-label="Next page">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
