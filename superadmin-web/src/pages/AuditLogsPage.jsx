import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ChevronRight, ChevronDown } from 'lucide-react';
import { api } from '../api/client';
import { FilterBar } from '../components/common/FilterBar';
import { Pagination } from '../components/common/Pagination';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
export const AuditLogsPage = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [actorType, setActorType] = useState('ALL');
    const [expandedLogId, setExpandedLogId] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-audit-logs', page, pageSize, search, actorType],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/audit-logs', {
                params: {
                    page,
                    limit: pageSize,
                    q: search || undefined,
                    actorType: actorType !== 'ALL' ? actorType : undefined,
                },
            });
            return res.data;
        },
    });
    const toggleExpand = (id) => {
        setExpandedLogId(expandedLogId === id ? null : id);
    };
    const logs = data?.data || [];
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Tamper-Evident System Audit Trail
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Cryptographically auditable event history tracking state-changing mutations across subscribers, foremen, and superadmins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold-500/10 text-gold-600 dark:text-gold-300 border border-gold-500/30">
            Immutable Event Log
          </span>
        </div>
      </div>

      <div className="bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-5 space-y-4 backdrop-blur-md">
        <FilterBar searchQuery={search} onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
        }} searchPlaceholder="Search audit events by action or actor...">
          <select value={actorType} onChange={(e) => {
            setActorType(e.target.value);
            setPage(1);
        }} className="text-xs py-2 px-3 bg-stone-50 dark:bg-[#1C0D18] border border-stone-200 dark:border-maroon-800/60 rounded-xl text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500">
            <option value="ALL">All Actor Types</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="USER">User / Foreman</option>
            <option value="SYSTEM">System Automations</option>
          </select>
        </FilterBar>

        {isLoading ? (<div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-16 rounded-2xl"/>))}
          </div>) : logs.length === 0 ? (<EmptyState title="No Audit Logs" description="No events match your criteria." icon={History}/>) : (<div className="divide-y divide-stone-100 dark:divide-maroon-950/70">
            {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (<div key={log.id} className="py-3.5">
                  <div onClick={() => toggleExpand(log.id)} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl hover:bg-stone-50 dark:hover:bg-[#1A0B14] cursor-pointer transition">
                    <div className="flex items-center gap-3">
                      <button className="text-stone-400 hover:text-gold-500">
                        {isExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                      </button>
                      <StatusBadge status={log.actor_type || 'SYSTEM'}/>
                      <div>
                        <span className="font-black text-sm text-stone-900 dark:text-stone-100 block">
                          {log.event_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          Actor: <strong className="text-stone-700 dark:text-stone-300">{log.actor_name || 'System'}</strong> ({log.actor_identifier || 'N/A'}) • Target: <span className="font-mono text-gold-600 dark:text-gold-400">{log.entity_type}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs text-stone-400 shrink-0">
                      <div className="font-medium">{new Date(log.created_at).toLocaleString()}</div>
                      <div className="font-mono text-[10px] text-stone-500">IP: {log.ip_address || '127.0.0.1'}</div>
                    </div>
                  </div>

                  {/* Expandable JSON Diff */}
                  {isExpanded && (<div className="mt-3 p-4.5 bg-black/60 text-stone-200 rounded-xl text-xs font-mono border border-maroon-900/40 space-y-3.5 overflow-x-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.before_state && (<div>
                            <span className="text-rose-400 font-bold block mb-1.5 uppercase text-[10px] tracking-wider">State Before Mutation:</span>
                            <pre className="p-3 bg-[#11050C] rounded-lg border border-rose-500/20 overflow-x-auto text-[11px] leading-relaxed text-rose-200">
                              {JSON.stringify(log.before_state, null, 2)}
                            </pre>
                          </div>)}
                        {log.after_state && (<div>
                            <span className="text-emerald-400 font-bold block mb-1.5 uppercase text-[10px] tracking-wider">State After Mutation:</span>
                            <pre className="p-3 bg-[#06120B] rounded-lg border border-emerald-500/20 overflow-x-auto text-[11px] leading-relaxed text-emerald-200">
                              {JSON.stringify(log.after_state, null, 2)}
                            </pre>
                          </div>)}
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (<div>
                          <span className="text-gold-400 font-bold block mb-1.5 uppercase text-[10px] tracking-wider">Event Cryptographic Metadata:</span>
                          <pre className="p-3 bg-[#160B12] rounded-lg border border-gold-500/20 overflow-x-auto text-[11px] leading-relaxed text-gold-200">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>)}
                    </div>)}
                </div>);
            })}
          </div>)}

        <Pagination
          currentPage={page}
          totalPages={data?.meta?.totalPages || 1}
          totalItems={data?.meta?.total || 0}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onPageChange={setPage}
        />
      </div>
    </div>);
};

