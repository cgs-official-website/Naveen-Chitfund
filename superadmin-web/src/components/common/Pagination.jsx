import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  if (totalItems === 0 && totalPages <= 1) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3.5 px-4 py-3 mt-3 bg-white/60 dark:bg-[#150A11]/60 border border-stone-200/80 dark:border-maroon-900/40 rounded-2xl text-xs text-stone-600 dark:text-stone-400 backdrop-blur-md">
      {/* Left: Summary text */}
      <div className="flex items-center gap-2 flex-wrap">
        <span>
          Showing <span className="font-bold text-stone-900 dark:text-stone-100">{startItem}</span> to{' '}
          <span className="font-bold text-stone-900 dark:text-stone-100">{endItem}</span> of{' '}
          <span className="font-bold text-stone-900 dark:text-stone-100">{totalItems}</span> results
        </span>
      </div>

      {/* Right: Page Size Filter Dropdown & Navigation Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Rows Per Page Filter */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                if (onPageChange) onPageChange(1);
              }}
              className="py-1 px-2.5 rounded-xl border border-stone-200/90 dark:border-maroon-800/60 bg-white dark:bg-[#1C0D18] text-stone-800 dark:text-gold-300 font-bold text-xs focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page Nav Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-xl border border-stone-200/90 dark:border-maroon-800/60 bg-white dark:bg-[#1A0C14] text-stone-700 dark:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-[#25101C] transition cursor-pointer shadow-2xs"
            aria-label="Previous Page"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 rounded-xl bg-stone-100/80 dark:bg-[#220E1A] font-bold text-stone-800 dark:text-gold-300 border border-stone-200/60 dark:border-maroon-900/40 text-xs">
            {currentPage} / {Math.max(1, totalPages)}
          </span>

          <button
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-xl border border-stone-200/90 dark:border-maroon-800/60 bg-white dark:bg-[#1A0C14] text-stone-700 dark:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-[#25101C] transition cursor-pointer shadow-2xs"
            aria-label="Next Page"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
