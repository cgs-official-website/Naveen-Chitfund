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
      className={`relative overflow-hidden rounded-[26px] p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between ${
        highlight
          ? 'bg-gradient-to-br from-[#2D0A17] via-[#4A1024] to-[#1C050E] text-white border-gold-500/50 shadow-xl shadow-maroon-950/40 ring-1 ring-gold-400/30'
          : 'bg-white/95 dark:bg-[#160A13]/95 text-slate-900 dark:text-slate-100 border-stone-200/90 dark:border-maroon-900/50 shadow-sm hover:shadow-lg hover:border-gold-500/40 hover:-translate-y-0.5'
      }`}
    >
      {/* Ambient corner aura */}
      {highlight && (
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-gold-400/20 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex items-start justify-between gap-3 relative z-10">
        <span
          className={`text-[11px] font-black uppercase tracking-wider leading-snug break-words ${
            highlight ? 'text-gold-300' : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          {title}
        </span>
        <div
          className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-transform ${
            highlight
              ? 'bg-gold-500/20 text-gold-300 border border-gold-400/40 shadow-xs'
              : 'bg-[#FAF0F4] dark:bg-[#281120] text-[#7A1F3D] dark:text-gold-400 border border-rose-100 dark:border-maroon-800/60 shadow-2xs'
          }`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="mt-4 relative z-10">
        <div className={`text-xl sm:text-2xl xl:text-[26px] font-black tracking-tight leading-tight truncate ${
          highlight ? 'text-white' : 'text-slate-900 dark:text-white'
        }`}>
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-2 flex items-center gap-2 text-[11px] leading-tight flex-wrap">
            {trend && (
              <span
                className={`font-black px-2 py-0.5 rounded-full shrink-0 ${
                  trend.isPositive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span
                className={`font-medium truncate ${
                  highlight ? 'text-stone-300/90' : 'text-stone-500 dark:text-stone-400'
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
