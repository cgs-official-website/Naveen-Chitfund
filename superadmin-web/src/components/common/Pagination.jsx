import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
export const Pagination = ({ currentPage, totalPages, totalItems, pageSize, onPageChange, }) => {
    if (totalPages <= 1 && totalItems === 0)
        return null;
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    return (<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-800 text-xs text-slate-600 dark:text-slate-400">
      <div>
        Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{endItem}</span> of{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className="p-1.5 rounded-input border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-navy-700 transition" aria-label="Previous Page">
          <ChevronLeft className="w-4 h-4"/>
        </button>

        <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-300">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="p-1.5 rounded-input border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-navy-700 transition" aria-label="Next Page">
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>
    </div>);
};
