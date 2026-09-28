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
            className={`p-4 bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-xs space-y-2.5 transition-all ${
              onRowClick
                ? 'cursor-pointer hover:border-gold-500/50 active:scale-[0.99]'
                : ''
            }`}
          >
            {columns.map((col, cIdx) => (
              <div key={cIdx} className="flex justify-between items-center text-xs gap-3">
                <span className="font-semibold text-stone-500 dark:text-stone-400">
                  {col.header}
                </span>
                <span className="font-medium text-stone-900 dark:text-stone-100 text-right">
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
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-stone-200/90 dark:border-maroon-900/50 shadow-sm bg-white dark:bg-[#1A0C14]">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-[#FAF7F2] dark:bg-[#220E1A] border-b border-stone-200/80 dark:border-maroon-900/50 text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-gold-300/90 sticky top-0 z-10">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-maroon-950/80">
            {data.map((item, idx) => (
              <tr
                key={item.id ? String(item.id) : idx}
                onClick={() => onRowClick && onRowClick(item)}
                className={`transition-colors duration-150 ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-amber-500/5 dark:hover:bg-gold-500/5'
                    : 'hover:bg-stone-50/50 dark:hover:bg-maroon-950/40'
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
  );
}
