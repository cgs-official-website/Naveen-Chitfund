import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase().trim();

  let textColor = 'text-stone-600 dark:text-stone-400 font-semibold';

  if (['ACTIVE', 'APPROVED', 'SUCCESS', 'DISBURSED', 'COMPLETED', 'VERIFIED'].includes(norm)) {
    textColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
  } else if (['LIVE'].includes(norm)) {
    textColor = 'text-amber-500 dark:text-amber-400 font-black';
  } else if (['PENDING', 'SUBMITTED', 'DUE_SOON'].includes(norm)) {
    textColor = 'text-amber-600 dark:text-amber-400 font-semibold';
  } else if (['REJECTED', 'FAILED', 'OVERDUE', 'SUSPENDED'].includes(norm)) {
    textColor = 'text-rose-600 dark:text-rose-400 font-semibold';
  } else if (['OPEN', 'SCHEDULED'].includes(norm)) {
    textColor = 'text-blue-600 dark:text-blue-400 font-semibold';
  } else if (['PS'].includes(norm)) {
    textColor = 'text-purple-600 dark:text-purple-400 font-semibold';
  } else if (['SB'].includes(norm)) {
    textColor = 'text-indigo-600 dark:text-indigo-400 font-semibold';
  } else if (['NPS'].includes(norm)) {
    textColor = 'text-stone-500 dark:text-stone-400 font-medium';
  }

  const formatText = (s) => {
    if (s === 'PS') return 'Prized (PS)';
    if (s === 'SB') return 'Successful Bidder (SB)';
    if (s === 'NPS') return 'Non-Prized (NPS)';
    return s.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-block text-[12px] tracking-wide uppercase ${textColor} ${className}`}
    >
      {formatText(norm)}
    </span>
  );
};

