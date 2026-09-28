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
    const [search, setSearch] = useState('');
    const [actorType, setActorType] = useState('ALL');
    const [expandedLogId, setExpandedLogId] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-audit-logs', page, search, actorType],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/audit-logs', {
                params: {
                    page,
                    limit: 15,
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
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Tamper-Evident System Audit Trail</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cryptographically auditable event history tracking state-changing mutations across subscribers, foremen, and superadmins.
        </p>
      </div>

      <div className="bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-4 space-y-4">
        <FilterBar searchQuery={search} onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
        }} searchPlaceholder="Search audit events by action or actor...">
          <select value={actorType} onChange={(e) => {
            setActorType(e.target.value);
            setPage(1);
        }} className="text-xs py-2 px-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-700 dark:text-slate-200">
            <option value="ALL">All Actor Types</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="USER">User / Foreman</option>
            <option value="SYSTEM">System</option>
          </select>
        </FilterBar>

        {isLoading ? (<div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-16 rounded-2xl"/>))}
          </div>) : logs.length === 0 ? (<EmptyState title="No Audit Logs" description="No events match your criteria." icon={History}/>) : (<div className="divide-y divide-stone-100 dark:divide-maroon-950/80/80">
            {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (<div key={log.id} className="py-3">
                  <div onClick={() => toggleExpand(log.id)} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50/80 dark:hover:bg-navy-800/40 cursor-pointer transition">
                    <div className="flex items-center gap-3">
                      <button className="text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                      </button>
                      <StatusBadge status={log.actor_type || 'SYSTEM'}/>
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
                          {log.event_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-500">
                          Actor: {log.actor_name || 'System'} ({log.actor_identifier || 'N/A'}) • Entity: {log.entity_type}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs text-slate-400 shrink-0">
                      <div>{new Date(log.created_at).toLocaleString()}</div>
                      <div className="font-mono text-[10px]">IP: {log.ip_address || '127.0.0.1'}</div>
                    </div>
                  </div>

                  {/* Expandable JSON Diff */}
                  {isExpanded && (<div className="mt-3 p-4 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono border border-navy-800 space-y-3 overflow-x-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.before_state && (<div>
                            <span className="text-rose-400 font-bold block mb-1">State Before Mutation:</span>
                            <pre className="p-2.5 bg-slate-900 rounded overflow-x-auto text-[11px] leading-relaxed">
                              {JSON.stringify(log.before_state, null, 2)}
                            </pre>
                          </div>)}
                        {log.after_state && (<div>
                            <span className="text-emerald-400 font-bold block mb-1">State After Mutation:</span>
                            <pre className="p-2.5 bg-slate-900 rounded overflow-x-auto text-[11px] leading-relaxed">
                              {JSON.stringify(log.after_state, null, 2)}
                            </pre>
                          </div>)}
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (<div>
                          <span className="text-gold-400 font-bold block mb-1">Event Metadata:</span>
                          <pre className="p-2.5 bg-slate-900 rounded overflow-x-auto text-[11px] leading-relaxed">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>)}
                    </div>)}
                </div>);
            })}
          </div>)}

        <Pagination currentPage={page} totalPages={data?.meta?.totalPages || 1} totalItems={data?.meta?.total || 0} pageSize={15} onPageChange={setPage}/>
      </div>
    </div>);
};

