import React from 'react';
export const Skeleton = ({ className = '' }) => {
    return (<div className={`animate-pulse bg-slate-200 dark:bg-navy-800 rounded ${className}`}/>);
};
export const TableSkeleton = ({ rows = 5, cols = 5, }) => {
    return (<div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rIdx) => (<div key={rIdx} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, cIdx) => (<Skeleton key={cIdx} className="h-6 flex-1 rounded"/>))}
        </div>))}
    </div>);
};
