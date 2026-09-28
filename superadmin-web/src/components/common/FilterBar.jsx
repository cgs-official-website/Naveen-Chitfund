import React from 'react';
import { Search, X } from 'lucide-react';
export const FilterBar = ({ searchQuery, onSearchChange, searchPlaceholder = 'Search...', children, actions, }) => {
    return (<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
          <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder} className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-input text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition"/>
          {searchQuery ? (<button onClick={() => onSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              <X className="w-3.5 h-3.5"/>
            </button>) : null}
        </div>

        {/* Filter dropdowns passed as children */}
        {children && <div className="flex items-center gap-2 overflow-x-auto">{children}</div>}
      </div>

      {/* Action Buttons */}
      {actions && <div className="flex items-center gap-2 justify-end">{actions}</div>}
    </div>);
};
