import React from 'react';

// Shimmer placeholders shown while a page's data is still loading.
export const SkeletonBar = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
);

// Mirrors the list pages: stacked cards on mobile, table rows on desktop.
export const ListSkeleton = ({ rows = 6, columns = 5 }) => (
  <div>
    <div className="md:hidden divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <SkeletonBar className="h-4 w-2/3" />
            <SkeletonBar className="h-3 w-1/3" />
            <SkeletonBar className="h-3 w-1/2" />
          </div>
          <SkeletonBar className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>

    <div className="hidden md:block divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: columns }).map((__, c) => (
            <SkeletonBar key={c} className={`h-4 ${c === 0 ? 'w-28' : c === columns - 1 ? 'w-10 ml-auto' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Mirrors the dashboard stat cards.
export const StatCardsSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200 bg-white">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <SkeletonBar className="h-6 w-6 sm:h-8 sm:w-8" />
          <SkeletonBar className="h-4 flex-1" />
          <SkeletonBar className="h-6 w-8" />
        </div>
        <div className="space-y-2">
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

// Mirrors the detail pages: field groups inside section cards.
export const DetailSkeleton = ({ sections = 3 }) => (
  <div className="space-y-6">
    {Array.from({ length: sections }).map((_, i) => (
      <div key={i} className="border border-gray-200 rounded-lg p-4 sm:p-6">
        <SkeletonBar className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((__, f) => (
            <div key={f} className="space-y-2">
              <SkeletonBar className="h-3 w-24" />
              <SkeletonBar className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
