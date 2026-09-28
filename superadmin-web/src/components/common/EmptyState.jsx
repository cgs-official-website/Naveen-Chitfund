import React from 'react';
import { Inbox } from 'lucide-react';
export const EmptyState = ({ title = 'No records found', description = 'Try adjusting your search or filters to find what you are looking for.', icon: Icon = Inbox, action, }) => {
    return (<div className="flex flex-col items-center justify-center p-8 text-center rounded-card border border-dashed border-slate-300 dark:border-navy-800 bg-white/50 dark:bg-navy-900/50">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
        <Icon className="w-6 h-6"/>
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>);
};
