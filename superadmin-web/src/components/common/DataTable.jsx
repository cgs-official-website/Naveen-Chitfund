import React from 'react';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './Skeleton';

export function DataTable({
  columns,
  data,
  isLoading = false,
  onRowClick,
  emptyTitle,
  emptyDescription,
}) {
  if (isLoading) {
    return <TableSkeleton rows={5} cols={columns.length} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="w-full">
      {/* Mobile Stacked View (<768px) */}
      <div className="block md:hidden space-y-3">
        {data.map((item, idx) => (
          <div
            key={item.id ? String(item.id) : idx}
            onClick={() => onRowClick && onRowClick(item)}
            className={`p-3.5 sm:p-4 bg-white/95 dark:bg-[#160B12]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-xs space-y-2.5 transition-all ${
              onRowClick
                ? 'cursor-pointer hover:border-gold-500/50 active:scale-[0.99]'
                : ''
            }`}
          >
            {columns.map((col, cIdx) => (
              <div key={cIdx} className="flex justify-between items-center text-xs gap-2.5 flex-wrap">
                <span className="font-bold text-stone-500 dark:text-stone-400 shrink-0 text-[11px] uppercase tracking-wider">
                  {col.header}
                </span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 text-right break-words">
                  {col.cell
                    ? col.cell(item)
                    : col.accessorKey
                    ? String(item[col.accessorKey] ?? '-')
                    : '-'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop & Tablet Table View (>=768px) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-stone-200/90 dark:border-maroon-900/50 shadow-sm bg-white/95 dark:bg-[#150A11]/95 backdrop-blur-md">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[640px]">
            <thead className="bg-stone-50/90 dark:bg-[#1F0C18]/90 border-b border-stone-200/80 dark:border-maroon-900/50 text-[11px] font-black uppercase tracking-wider text-stone-600 dark:text-gold-300/90">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={`px-4 lg:px-5 py-3.5 lg:py-4 whitespace-nowrap ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-maroon-950/70">
              {data.map((item, idx) => (
                <tr
                  key={item.id ? String(item.id) : idx}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors duration-150 ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-gold-500/5 dark:hover:bg-gold-400/5'
                      : 'hover:bg-stone-50/60 dark:hover:bg-maroon-950/30'
                  }`}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-5 py-4 text-stone-800 dark:text-stone-200 font-medium ${
                        col.className || ''
                      }`}
                    >
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                        ? String(item[col.accessorKey] ?? '-')
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
