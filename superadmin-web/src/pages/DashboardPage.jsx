import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Layers, Gavel, UserCheck, ShieldCheck, Clock, Users, Radio, ArrowRight, } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, } from 'recharts';
import { api } from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { CurrencyText } from '../components/common/CurrencyText';
import { Skeleton } from '../components/common/Skeleton';
import { StatusBadge } from '../components/common/StatusBadge';
export const DashboardPage = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-dashboard'],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/dashboard/summary');
            return res.data.data;
        },
        refetchInterval: 30000,
    });
    const metrics = data?.metrics || {};
    const liveAuction = data?.liveAuction;
    if (isLoading) {
        return (<div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-32 rounded-card"/>))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-28 rounded-card"/>))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-card"/>
          <Skeleton className="h-80 rounded-card"/>
        </div>
      </div>);
    }
    return (<div className="space-y-8">
      {/* Curved Greeting / Command Deck Hero Banner (matching reference UI top green pill card) */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-[#1E0814] via-[#380E20] to-[#16060E] dark:from-[#1A0712] dark:via-[#2E0B1A] dark:to-[#12040C] border border-gold-500/30 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Subtle decorative aura glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-gold-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-maroon-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-gold-400 text-[#140810]">
              GOVERNANCE DECK
            </span>
            <span className="text-gold-300/80 font-bold text-[11px]">
              Fiduciary Surveillance Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
            Institutional Command Deck
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-medium max-w-xl">
            Surveillance of ROSCA liquidity cycles, Section 18 filings, and real-time reverse auctions.
          </p>
        </div>

        {/* Live Auction Action Pill inside Hero Banner */}
        {liveAuction ? (
          <div className="relative z-10 p-3.5 sm:p-4 rounded-2xl bg-white/10 dark:bg-black/30 border border-gold-400/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 w-full sm:w-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-amber-600 text-maroon-950 flex items-center justify-center shadow-md shadow-gold-500/30 shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-gold-300 block">
                  Auction #{liveAuction.month_number} Live
                </span>
                <span className="text-xs font-black text-white truncate block">
                  {liveAuction.group_name}
                </span>
              </div>
            </div>
            <Link
              to="/chit/auctions"
              className="px-4 py-2 rounded-full bg-gold-400 hover:bg-gold-300 text-maroon-950 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-gold-500/25 transition shrink-0"
            >
              <span>Monitor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="relative z-10 flex items-center gap-2">
            <Link
              to="/chit/auctions"
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition flex items-center gap-2"
            >
              <span>Auction Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Primary Row: 4 Core StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Assets Under Mgmt" value={<CurrencyText amount={metrics.totalAum}/>} subtitle="Aggregate chit pool value" icon={DollarSign} highlight/>
        <StatCard title="Monthly Collections" value={<CurrencyText amount={metrics.monthlyCollection}/>} subtitle="Recovered subscriber dues" icon={TrendingUp}/>
        <StatCard title="Active Chit Groups" value={metrics.activeGroups ?? 0} subtitle="Open & active tenures" icon={Layers}/>
        <StatCard title="Live Auctions" value={metrics.liveAuctions ?? 0} subtitle="Currently active bidding" icon={Gavel}/>
      </div>

      {/* Secondary Row: Operational Queues */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Pending Member KYC" value={metrics.pendingKyc ?? 0} subtitle="Awaiting manual review" icon={UserCheck}/>
        <StatCard title="Pending Sureties" value={metrics.pendingSureties ?? 0} subtitle="Post-auction prize claims" icon={ShieldCheck}/>
        <StatCard title="Overdue Installments" value={metrics.overdueInstallments ?? 0} subtitle="Pending collection schedule" icon={Clock}/>
        <StatCard title="Total Subscribers" value={metrics.totalSubscribers ?? 0} subtitle="Enrolled members" icon={Users}/>
      </div>

      {/* Charts Row - Styled with rounded-[28px] pill cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 12-Month Collections vs Dues Trend */}
        <div className="lg:col-span-2 p-6 sm:p-7 bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-[28px] shadow-sm backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight">
                12-Month Collections vs Installment Dues
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Aggregate collection efficiency across all active chit groups
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-stone-100 dark:bg-[#1E0C17] border border-stone-200 dark:border-maroon-900/50 self-start sm:self-auto text-[11px] font-bold">
              <span className="px-3 py-1 rounded-full bg-white dark:bg-gold-500/20 text-stone-900 dark:text-gold-300 shadow-2xs">
                Monthly
              </span>
              <span className="px-3 py-1 text-stone-400">
                Annual
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthlyTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.12} stroke="#888"/>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11}/>
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${val / 1000}k`}`}/>
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']} contentStyle={{ backgroundColor: '#160B12', borderColor: '#4E1327', borderRadius: 16, fontSize: 12, color: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}/>
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }}/>
                <Line type="monotone" dataKey="dues" stroke="#94A3B8" name="Scheduled Dues" strokeWidth={2.5} dot={{ r: 3 }}/>
                <Line type="monotone" dataKey="collections" stroke="#C9A227" name="Collected" strokeWidth={3.5} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Group Status Donut */}
        <div className="p-6 sm:p-7 bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-[28px] shadow-sm flex flex-col justify-between backdrop-blur-md">
          <div>
            <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Chit Group Portfolio Status
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 mb-4">
              Tenure distribution across states
            </p>
          </div>

          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.groupStatusBreakdown || []} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {(data?.groupStatusBreakdown || []).map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#160B12', borderColor: '#4E1327', borderRadius: 16, fontSize: 12, color: '#fff' }}/>
                <Legend wrapperStyle={{ fontSize: 12 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed / Table Section - Styled with rounded-[28px] pill card */}
      <div className="p-5 sm:p-7 bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-[28px] shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 tracking-tight">
              Recent Tamper-Evident Activity Feed
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Live audit events logged across subscriber, foreman, and superadmin actions
            </p>
          </div>
          <Link
            to="/chit/audit"
            className="px-4 py-2 rounded-full bg-stone-100 dark:bg-[#1C0A16] hover:bg-gold-500/10 border border-stone-200 dark:border-maroon-800/60 text-xs font-black text-gold-600 dark:text-gold-400 transition self-start sm:self-auto shrink-0 flex items-center gap-1.5"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Mobile View: Stacked Card List (< 768px) */}
        <div className="md:hidden divide-y divide-stone-100 dark:divide-maroon-950/70">
          {(data?.recentAuditLogs || []).length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-400">No recent activity logged</div>
          ) : (
            (data?.recentAuditLogs || []).map((log) => (
              <div key={log.id} className="py-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={log.actor_type || 'SYSTEM'} />
                  <span className="text-[11px] text-stone-400 font-medium">
                    {new Date(log.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-stone-900 dark:text-stone-100 break-words">
                    {log.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400 mt-0.5 text-[11px]">
                    by {log.actor_name || 'System'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop / Tablet View: Tabular Layout (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200/80 dark:border-maroon-900/40 text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
                <th className="pb-3 pr-4">Actor Type</th>
                <th className="pb-3 px-4">Event Description</th>
                <th className="pb-3 px-4">Initiated By</th>
                <th className="pb-3 pl-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-maroon-950/70">
              {(data?.recentAuditLogs || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-stone-400">
                    No recent activity logged
                  </td>
                </tr>
              ) : (
                (data?.recentAuditLogs || []).map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/50 dark:hover:bg-maroon-950/30 transition-colors">
                    <td className="py-3.5 pr-4">
                      <StatusBadge status={log.actor_type || 'SYSTEM'} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                      {log.event_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 dark:text-stone-400">
                      {log.actor_name || 'System'}
                    </td>
                    <td className="py-3.5 pl-4 text-right text-stone-400 font-medium whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
};
