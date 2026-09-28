import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase().trim();

  let styles = 'bg-slate-100 text-slate-700 dark:bg-stone-800 dark:text-stone-300 border-slate-200 dark:border-stone-700';
  let dotColor = 'bg-slate-400';

  if (['ACTIVE', 'APPROVED', 'SUCCESS', 'DISBURSED', 'COMPLETED', 'VERIFIED'].includes(norm)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80';
    dotColor = 'bg-emerald-500';
  } else if (['LIVE'].includes(norm)) {
    styles = 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold border-amber-600 shadow-sm shadow-amber-500/25';
    dotColor = 'bg-white animate-ping';
  } else if (['PENDING', 'SUBMITTED', 'DUE_SOON'].includes(norm)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80';
    dotColor = 'bg-amber-500';
  } else if (['REJECTED', 'FAILED', 'OVERDUE', 'SUSPENDED'].includes(norm)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80';
    dotColor = 'bg-rose-500';
  } else if (['OPEN', 'SCHEDULED'].includes(norm)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80';
    dotColor = 'bg-blue-500';
  } else if (['PS'].includes(norm)) {
    styles = 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/80';
    dotColor = 'bg-purple-500';
  } else if (['SB'].includes(norm)) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/80';
    dotColor = 'bg-indigo-500';
  } else if (['NPS'].includes(norm)) {
    styles = 'bg-stone-100 text-stone-700 border-stone-200/80 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
    dotColor = 'bg-stone-400';
  }

  const formatText = (s) => {
    if (s === 'PS') return 'Prized (PS)';
    if (s === 'SB') return 'Successful Bidder (SB)';
    if (s === 'NPS') return 'Non-Prized (NPS)';
    return s.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border shadow-2xs ${styles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{formatText(norm)}</span>
    </span>
  );
};
