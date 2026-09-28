import React from 'react';
export const StatusBadge = ({ status, className = '' }) => {
    const norm = (status || '').toUpperCase().trim();
    let styles = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    if (['ACTIVE', 'APPROVED', 'SUCCESS', 'DISBURSED', 'COMPLETED', 'VERIFIED'].includes(norm)) {
        styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
    }
    else if (['LIVE'].includes(norm)) {
        styles = 'bg-amber-500 text-white font-semibold border-amber-600 animate-pulse shadow-sm shadow-amber-500/20';
    }
    else if (['PENDING', 'SUBMITTED', 'DUE_SOON'].includes(norm)) {
        styles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    }
    else if (['REJECTED', 'FAILED', 'OVERDUE', 'SUSPENDED'].includes(norm)) {
        styles = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
    }
    else if (['OPEN', 'SCHEDULED'].includes(norm)) {
        styles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
    }
    else if (['PS'].includes(norm)) {
        styles = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    }
    else if (['SB'].includes(norm)) {
        styles = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';
    }
    else if (['NPS'].includes(norm)) {
        styles = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
    const formatText = (s) => {
        if (s === 'PS')
            return 'Prized (PS)';
        if (s === 'SB')
            return 'Successful Bidder (SB)';
        if (s === 'NPS')
            return 'Non-Prized (NPS)';
        return s.replace(/_/g, ' ');
    };
    return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}>
      {formatText(norm)}
    </span>);
};
