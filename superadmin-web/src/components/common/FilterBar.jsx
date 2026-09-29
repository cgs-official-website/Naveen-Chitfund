import React from 'react';
import { Search, X } from 'lucide-react';

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-0">
        {/* Search Box */}
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-white/90 dark:bg-[#160B12]/90 border border-stone-200/90 dark:border-maroon-800/60 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 shadow-2xs transition backdrop-blur-sm"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 cursor-pointer transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Filter dropdowns passed as children */}
        {children && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 shrink-0">{children}</div>
        )}
      </div>

      {/* Action Buttons */}
      {actions && (
        <div className="flex items-center gap-2.5 justify-end shrink-0 flex-wrap">{actions}</div>
      )}
    </div>
  );
};
