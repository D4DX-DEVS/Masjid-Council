import React from 'react';

// Mobile stand-in for the admin list tables, which are too wide for a phone.
// Each page supplies small accessor functions for the fields it wants to show.
const MobileRecordCards = ({
  items,
  onSelect,
  id,
  title,
  meta,
  status,
  empty = 'No records found'
}) => (
  <div className="md:hidden divide-y divide-gray-200">
    {items.length > 0 ? (
      items.map((item, index) => (
        <button
          key={item._id || index}
          onClick={() => onSelect(item)}
          className="w-full text-left px-4 py-2.5 hover:bg-gray-50"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 text-sm truncate">{title(item, index)}</p>
            {status && <div className="flex-shrink-0">{status(item, index)}</div>}
          </div>
          {/* id and meta share one line so the row stays short */}
          {(id || meta) && (
            <p className="mt-0.5 text-xs text-gray-500 truncate">
              {[id && id(item, index), meta && meta(item, index)].filter(Boolean).join(' · ')}
            </p>
          )}
        </button>
      ))
    ) : (
      <p className="p-8 text-center text-gray-500">{empty}</p>
    )}
  </div>
);

export default MobileRecordCards;
