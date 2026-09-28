import React from 'react';
export const StatCard = ({ title, value, subtitle, icon: Icon, trend, highlight = false, }) => {
    return (<div className={`rounded-card p-5 border transition-all duration-200 ${highlight
            ? 'bg-gradient-to-br from-navy-900 to-navy-800 text-white border-gold-500/40 shadow-md shadow-navy-950/20'
            : 'bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-navy-800 shadow-sm'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-gold-300' : 'text-slate-500 dark:text-slate-400'}`}>
          {title}
        </span>
        <div className={`p-2.5 rounded-lg ${highlight
            ? 'bg-gold-500/20 text-gold-300'
            : 'bg-slate-100 dark:bg-navy-800 text-navy-700 dark:text-gold-400'}`}>
          <Icon className="w-5 h-5"/>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(subtitle || trend) && (<div className="mt-1.5 flex items-center gap-2 text-xs">
            {trend && (<span className={`font-semibold ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend.value}
              </span>)}
            {subtitle && (<span className={highlight ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                {subtitle}
              </span>)}
          </div>)}
      </div>
    </div>);
};
