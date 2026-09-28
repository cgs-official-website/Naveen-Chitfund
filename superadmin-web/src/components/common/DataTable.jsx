import React from 'react';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './Skeleton';
export function DataTable({ columns, data, isLoading = false, onRowClick, emptyTitle, emptyDescription, }) {
    if (isLoading) {
        return <TableSkeleton rows={5} cols={columns.length}/>;
    }
    if (!data || data.length === 0) {
        return <EmptyState title={emptyTitle} description={emptyDescription}/>;
    }
    return (<div className="w-full">
      {/* Mobile Stacked View (<768px) */}
      <div className="block md:hidden space-y-3">
        {data.map((item, idx) => (<div key={item.id ? String(item.id) : idx} onClick={() => onRowClick && onRowClick(item)} className={`p-4 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-card shadow-sm space-y-2.5 ${onRowClick ? 'cursor-pointer hover:border-gold-500/50 active:bg-slate-50 dark:active:bg-navy-800' : ''}`}>
            {columns.map((col, cIdx) => (<div key={cIdx} className="flex justify-between items-center text-xs gap-3">
                <span className="font-medium text-slate-500 dark:text-slate-400">{col.header}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-right">
                  {col.cell
                    ? col.cell(item)
                    : col.accessorKey
                        ? String(item[col.accessorKey] ?? '-')
                        : '-'}
                </span>
              </div>))}
          </div>))}
      </div>

      {/* Desktop & Tablet Table View (>=768px) */}
      <div className="hidden md:block overflow-x-auto rounded-card border border-slate-200 dark:border-navy-800 shadow-sm bg-white dark:bg-navy-900">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-navy-950/60 border-b border-slate-200 dark:border-navy-800 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 sticky top-0 z-10">
            <tr>
              {columns.map((col, idx) => (<th key={idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
            {data.map((item, idx) => (<tr key={item.id ? String(item.id) : idx} onClick={() => onRowClick && onRowClick(item)} className={`transition-colors duration-150 ${onRowClick
                ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-navy-800/50'
                : 'hover:bg-slate-50/40 dark:hover:bg-navy-800/20'}`}>
                {columns.map((col, cIdx) => (<td key={cIdx} className={`px-4 py-3.5 text-slate-800 dark:text-slate-200 ${col.className || ''}`}>
                    {col.cell
                    ? col.cell(item)
                    : col.accessorKey
                        ? String(item[col.accessorKey] ?? '-')
                        : '-'}
                  </td>))}
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
