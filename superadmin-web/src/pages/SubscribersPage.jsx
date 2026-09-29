import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { api } from '../api/client';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Pagination } from '../components/common/Pagination';
import { StatusBadge } from '../components/common/StatusBadge';
import { CurrencyText } from '../components/common/CurrencyText';
import { Modal } from '../components/common/Modal';
export const SubscribersPage = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [kycFilter, setKycFilter] = useState('');
    const [selectedSubId, setSelectedSubId] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-subscribers', page, pageSize, search, kycFilter],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/subscribers', {
                params: { page, limit: pageSize, q: search || undefined, kycStatus: kycFilter || undefined },
            });
            return res.data;
        },
    });
    const { data: detailData, isLoading: isDetailLoading } = useQuery({
        queryKey: ['superadmin-subscriber-detail', selectedSubId],
        queryFn: async () => {
            if (!selectedSubId)
                return null;
            const res = await api.get(`/api/v1/superadmin/subscribers/${selectedSubId}`);
            return res.data.data;
        },
        enabled: Boolean(selectedSubId),
    });
    const columns = [
        {
            header: 'Subscriber',
            accessorKey: 'full_name',
            cell: (item) => (<div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.full_name}</span>
          <span className="text-xs text-slate-500 font-mono">{item.phone}</span>
        </div>),
        },
        {
            header: 'PAN Number',
            accessorKey: 'pan_number',
            cell: (item) => <span className="font-mono text-xs">{item.pan_number || 'NOT_SUBMITTED'}</span>,
        },
        {
            header: 'KYC Status',
            accessorKey: 'kyc_status',
            cell: (item) => <StatusBadge status={item.kyc_status}/>,
        },
        {
            header: 'Active Tickets',
            cell: (item) => (<span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
          {item.tickets_count || 0} ({item.prized_tickets_count || 0} Prized)
        </span>),
        },
        {
            header: 'Enrolled On',
            accessorKey: 'created_at',
            cell: (item) => (<span className="text-xs text-slate-500">
          {new Date(item.created_at).toLocaleDateString()}
        </span>),
        },
        {
            header: 'Actions',
            cell: (item) => (<button onClick={() => setSelectedSubId(item.id)} className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1">
          <Eye className="w-3.5 h-3.5"/> View Ledger
        </button>),
        },
    ];
    const sub = detailData?.subscriber;
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Subscribers Roster
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Review participant identity, verified tickets, KYC credentials, and installment payments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold-500/10 text-gold-600 dark:text-gold-300 border border-gold-500/30">
            Registered Chit Members
          </span>
        </div>
      </div>

      <div className="bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-5 backdrop-blur-md">
        <FilterBar searchQuery={search} onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
        }} searchPlaceholder="Search subscribers by name or phone...">
          <select value={kycFilter} onChange={(e) => {
            setKycFilter(e.target.value);
            setPage(1);
        }} className="text-xs py-2 px-3 bg-stone-50 dark:bg-[#1C0D18] border border-stone-200 dark:border-maroon-800/60 rounded-xl text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500">
            <option value="">All KYC Statuses</option>
            <option value="APPROVED">Approved Only</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </FilterBar>

        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} onRowClick={(item) => setSelectedSubId(item.id)} emptyTitle="No Subscribers" emptyDescription="No subscribers match your search filter."/>

        <Pagination
          currentPage={page}
          totalPages={data?.meta?.totalPages || 1}
          totalItems={data?.meta?.total || 0}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Subscriber Detail Modal */}
      <Modal isOpen={Boolean(selectedSubId)} onClose={() => setSelectedSubId(null)} title={sub?.full_name ? `Subscriber: ${sub.full_name}` : 'Subscriber Profile'} maxWidth="2xl">
        {isDetailLoading ? (<div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading profile...</div>) : (<div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Contact Phone</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{sub?.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">PAN Card</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{sub?.pan_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">KYC Verification</span>
                <StatusBadge status={sub?.kyc_status}/>
              </div>
            </div>

            {/* Enrolled Chits */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                Active Chit Tickets ({detailData?.subscriptions?.length || 0})
              </h4>
              <div className="space-y-2">
                {(detailData?.subscriptions || []).map((s) => (<div key={s.id} className="p-3 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{s.group_name}</span>
                      <span className="text-slate-500">
                        Ticket #{s.ticket_number} • Chit Value: <CurrencyText amount={s.chit_amount}/>
                      </span>
                    </div>
                    <StatusBadge status={s.subscriber_status}/>
                  </div>))}
              </div>
            </div>

            {/* Installments History */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                Recent Installments Schedule ({detailData?.installments?.length || 0})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(detailData?.installments || []).map((inst) => (<div key={inst.id} className="p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Month #{inst.month_number} — {inst.group_name}
                      </span>
                      <span className="text-slate-400 text-[11px]">Due: <CurrencyText amount={inst.amount_due}/></span>
                    </div>
                    <StatusBadge status={inst.status}/>
                  </div>))}
              </div>
            </div>
          </div>)}
      </Modal>
    </div>);
};

