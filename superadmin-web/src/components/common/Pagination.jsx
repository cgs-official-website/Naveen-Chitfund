import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1 && totalItems === 0) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 mt-2 bg-transparent text-xs text-stone-600 dark:text-stone-400">
      <div>
        Showing <span className="font-bold text-stone-900 dark:text-stone-100">{startItem}</span> to{' '}
        <span className="font-bold text-stone-900 dark:text-stone-100">{endItem}</span> of{' '}
        <span className="font-bold text-stone-900 dark:text-stone-100">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-xl border border-stone-200/90 dark:border-maroon-800/60 bg-white dark:bg-[#1A0C14] text-stone-700 dark:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-[#25101C] transition cursor-pointer shadow-2xs"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3.5 py-1.5 rounded-xl bg-stone-100/80 dark:bg-[#220E1A] font-semibold text-stone-800 dark:text-gold-300 border border-stone-200/60 dark:border-maroon-900/40">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-xl border border-stone-200/90 dark:border-maroon-800/60 bg-white dark:bg-[#1A0C14] text-stone-700 dark:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-[#25101C] transition cursor-pointer shadow-2xs"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
