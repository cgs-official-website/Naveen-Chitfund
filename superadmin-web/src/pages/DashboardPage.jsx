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
      {/* Live Auction Banner if any is active */}
      {liveAuction && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#2A0E18] via-[#4E1327] to-[#1F0A14] text-white border border-gold-500/40 shadow-xl shadow-maroon-950/25 ring-1 ring-gold-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-500 to-amber-600 text-maroon-950 flex items-center justify-center shadow-md shadow-gold-500/30 animate-pulse shrink-0">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gold-300">
                  Live Reverse Auction In Progress
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gold-400 text-maroon-950">
                  Month #{liveAuction.month_number}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1 tracking-tight">
                {liveAuction.group_name} (<CurrencyText amount={liveAuction.chit_amount} />)
              </h3>
            </div>
          </div>
          <Link
            to="/chit/auctions"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-maroon-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-gold-500/25 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <span>Monitor Live Feed</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Primary Row: 4 Core StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Assets Under Mgmt (AUM)" value={<CurrencyText amount={metrics.totalAum}/>} subtitle="Aggregate chit pool value" icon={DollarSign} highlight/>
        <StatCard title="Monthly Collections" value={<CurrencyText amount={metrics.monthlyCollection}/>} subtitle="Recovered subscriber dues" icon={TrendingUp}/>
        <StatCard title="Active Chit Groups" value={metrics.activeGroups ?? 0} subtitle="Open & active tenures" icon={Layers}/>
        <StatCard title="Live Auctions" value={metrics.liveAuctions ?? 0} subtitle="Currently active bidding" icon={Gavel}/>
      </div>

      {/* Secondary Row: Operational Queues */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Member KYC" value={metrics.pendingKyc ?? 0} subtitle="Awaiting manual review" icon={UserCheck}/>
        <StatCard title="Pending Sureties" value={metrics.pendingSureties ?? 0} subtitle="Post-auction prize claims" icon={ShieldCheck}/>
        <StatCard title="Overdue Installments" value={metrics.overdueInstallments ?? 0} subtitle="Pending collection schedule" icon={Clock}/>
        <StatCard title="Total Subscribers" value={metrics.totalSubscribers ?? 0} subtitle="Enrolled members" icon={Users}/>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 12-Month Collections vs Dues Trend */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                12-Month Collections vs Installment Dues
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Aggregate collection efficiency across all active chit groups
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthlyTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15}/>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11}/>
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${val / 1000}k`}`}/>
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']} contentStyle={{ backgroundColor: '#1A0C14', borderColor: '#4E1327', borderRadius: 12, fontSize: 12, color: '#fff' }}/>
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }}/>
                <Line type="monotone" dataKey="dues" stroke="#94A3B8" name="Scheduled Dues" strokeWidth={2} dot={{ r: 3 }}/>
                <Line type="monotone" dataKey="collections" stroke="#C9A227" name="Collected" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Group Status Donut */}
        <div className="p-6 bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Chit Group Portfolio Status
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 mb-4">
            Tenure distribution across states
          </p>

          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.groupStatusBreakdown || []} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {(data?.groupStatusBreakdown || []).map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A0C14', borderColor: '#4E1327', borderRadius: 12, fontSize: 12, color: '#fff' }}/>
                <Legend wrapperStyle={{ fontSize: 12 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="p-6 bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Recent Tamper-Evident Activity Feed
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Live audit events logged across subscriber, foreman, and superadmin actions
            </p>
          </div>
          <Link to="/chit/audit" className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline">
            View All Audit Logs &rarr;
          </Link>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-maroon-950/80">
          {(data?.recentAuditLogs || []).map((log) => (
            <div key={log.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <StatusBadge status={log.actor_type || 'SYSTEM'}/>
                <div>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {log.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400 ml-2">
                    by {log.actor_name || 'System'}
                  </span>
                </div>
              </div>
              <span className="text-stone-400 shrink-0 font-medium">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>);
};
