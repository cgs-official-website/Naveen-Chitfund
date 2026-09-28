import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = false,
}) => {
  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-200 ${
        highlight
          ? 'bg-gradient-to-br from-[#360D1B] via-[#4E1327] to-[#250A13] text-white border-gold-500/40 shadow-lg shadow-maroon-950/25 ring-1 ring-gold-400/20'
          : 'bg-white dark:bg-[#1C0D17] text-slate-900 dark:text-slate-100 border-stone-200/85 dark:border-maroon-900/50 shadow-sm hover:shadow-md hover:border-gold-500/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider leading-relaxed ${
            highlight ? 'text-gold-300' : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          {title}
        </span>
        <div
          className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-transform ${
            highlight
              ? 'bg-gold-500/20 text-gold-300 border border-gold-400/30'
              : 'bg-[#FAF0F4] dark:bg-[#2C1423] text-[#7A1F3D] dark:text-gold-400 border border-rose-100 dark:border-maroon-800/60'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3.5">
        <div className="text-2xl sm:text-[26px] font-extrabold tracking-tight leading-none">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            {trend && (
              <span
                className={`font-bold ${
                  trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span
                className={`font-medium ${
                  highlight ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
