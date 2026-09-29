import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase().trim();

  let styles = 'bg-stone-100 text-stone-700 dark:bg-stone-900/60 dark:text-stone-300 border-stone-200 dark:border-stone-800';
  let dotColor = 'bg-stone-400';

  if (['ACTIVE', 'APPROVED', 'SUCCESS', 'DISBURSED', 'COMPLETED', 'VERIFIED'].includes(norm)) {
    styles = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    dotColor = 'bg-emerald-500 shadow-sm shadow-emerald-500/50';
  } else if (['LIVE'].includes(norm)) {
    styles = 'bg-gradient-to-r from-gold-500 via-amber-500 to-gold-500 text-maroon-950 font-black border-gold-400 shadow-sm shadow-gold-500/30';
    dotColor = 'bg-white animate-ping';
  } else if (['PENDING', 'SUBMITTED', 'DUE_SOON'].includes(norm)) {
    styles = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-500 shadow-sm shadow-amber-500/50';
  } else if (['REJECTED', 'FAILED', 'OVERDUE', 'SUSPENDED'].includes(norm)) {
    styles = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
    dotColor = 'bg-rose-500 shadow-sm shadow-rose-500/50';
  } else if (['OPEN', 'SCHEDULED'].includes(norm)) {
    styles = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
    dotColor = 'bg-blue-500 shadow-sm shadow-blue-500/50';
  } else if (['PS'].includes(norm)) {
    styles = 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
    dotColor = 'bg-purple-500 shadow-sm shadow-purple-500/50';
  } else if (['SB'].includes(norm)) {
    styles = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
    dotColor = 'bg-indigo-500 shadow-sm shadow-indigo-500/50';
  } else if (['NPS'].includes(norm)) {
    styles = 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/30';
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border shadow-2xs ${styles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{formatText(norm)}</span>
    </span>
  );
};
