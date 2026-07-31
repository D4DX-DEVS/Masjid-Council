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
          className="w-full text-left p-4 hover:bg-gray-50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{title(item, index)}</p>
              {id && <p className="text-xs text-gray-500 mt-0.5">{id(item, index)}</p>}
              {meta && <p className="text-xs text-gray-500 mt-1">{meta(item, index)}</p>}
            </div>
            {status && <div className="flex-shrink-0">{status(item, index)}</div>}
          </div>
        </button>
      ))
    ) : (
      <p className="p-8 text-center text-gray-500">{empty}</p>
    )}
  </div>
);

export default MobileRecordCards;
