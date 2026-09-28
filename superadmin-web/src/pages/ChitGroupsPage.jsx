import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, Eye, Users, Gavel, BookOpen } from 'lucide-react';
import { api } from '../api/client';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Pagination } from '../components/common/Pagination';
import { StatusBadge } from '../components/common/StatusBadge';
import { CurrencyText } from '../components/common/CurrencyText';
import { Modal } from '../components/common/Modal';
export const ChitGroupsPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-chit-groups', page, search, statusFilter],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/chit-groups', {
                params: { page, limit: 10, q: search || undefined, status: statusFilter || undefined },
            });
            return res.data;
        },
    });
    const { data: detailData, isLoading: isDetailLoading } = useQuery({
        queryKey: ['superadmin-group-detail', selectedGroupId],
        queryFn: async () => {
            if (!selectedGroupId)
                return null;
            const res = await api.get(`/api/v1/superadmin/chit-groups/${selectedGroupId}`);
            return res.data.data;
        },
        enabled: Boolean(selectedGroupId),
    });
    const columns = [
        {
            header: 'Group Name',
            accessorKey: 'name',
            cell: (item) => (<div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.name}</span>
          <span className="text-xs text-slate-500 font-mono">{item.pso_number ? `PSO: ${item.pso_number}` : 'Pending PSO'}</span>
        </div>),
        },
        {
            header: 'Chit Value',
            accessorKey: 'chit_amount',
            cell: (item) => <CurrencyText amount={item.chit_amount} className="font-bold text-gold-600 dark:text-gold-400"/>,
        },
        {
            header: 'Tenure',
            accessorKey: 'duration_months',
            cell: (item) => <span>{item.duration_months} Months</span>,
        },
        {
            header: 'Commission',
            accessorKey: 'foreman_commission_pct',
            cell: (item) => <span>{item.foreman_commission_pct}%</span>,
        },
        {
            header: 'Subscribers Filled',
            cell: (item) => (<span className="font-semibold text-xs">
          {item.filled_subscribers ?? 0} / {item.duration_months}
        </span>),
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (item) => <StatusBadge status={item.status}/>,
        },
        {
            header: 'Actions',
            cell: (item) => (<button onClick={() => {
                    setSelectedGroupId(item.id);
                    setActiveTab('overview');
                }} className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1">
          <Eye className="w-3.5 h-3.5"/> Details
        </button>),
        },
    ];
    const group = detailData?.group;
    return (<div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Chit Groups Portfolio</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review state-sanctioned ROSCA pools, member allocations, and auction schedules.
        </p>
      </div>

      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-card shadow-sm p-4">
        <FilterBar searchQuery={search} onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
        }} searchPlaceholder="Search chit groups...">
          <select value={statusFilter} onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
        }} className="text-xs py-2 px-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-700 dark:text-slate-200">
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </FilterBar>

        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} onRowClick={(item) => {
            setSelectedGroupId(item.id);
            setActiveTab('overview');
        }} emptyTitle="No Chit Groups" emptyDescription="No registered chit groups found matching your criteria."/>

        <Pagination currentPage={page} totalPages={data?.meta?.totalPages || 1} totalItems={data?.meta?.total || 0} pageSize={10} onPageChange={setPage}/>
      </div>

      {/* Tabbed Group Detail Modal */}
      <Modal isOpen={Boolean(selectedGroupId)} onClose={() => setSelectedGroupId(null)} title={group?.name || 'Chit Group Detail'} maxWidth="4xl">
        {isDetailLoading ? (<div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading group details...</div>) : (<div className="space-y-6">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-navy-800 text-xs font-semibold gap-6">
              {[
                { key: 'overview', label: 'Overview', icon: Layers },
                { key: 'members', label: `Members (${detailData?.members?.length || 0})`, icon: Users },
                { key: 'auctions', label: `Auctions (${detailData?.auctions?.length || 0})`, icon: Gavel },
                { key: 'ledger', label: 'Ledger Audit', icon: BookOpen },
            ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`pb-3 flex items-center gap-1.5 border-b-2 transition ${isActive
                        ? 'border-gold-500 text-gold-600 dark:text-gold-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                    <Icon className="w-4 h-4"/>
                    <span>{tab.label}</span>
                  </button>);
            })}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (<div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-card bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800 text-xs">
                  <div>
                    <span className="text-slate-400 block">Total Chit Value</span>
                    <span className="text-base font-bold text-gold-500">
                      <CurrencyText amount={group?.chit_amount}/>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Monthly Installment</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                      <CurrencyText amount={Number(group?.chit_amount || 0) / Number(group?.duration_months || 1)}/>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tenure Duration</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {group?.duration_months} Months
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Foreman Commission</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {group?.foreman_commission_pct}%
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-card border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-xs space-y-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    Statutory Certifications & Guarantees
                  </span>
                  <p className="text-slate-500">
                    Prior Sanction Order (PSO): <code className="text-gold-500">{group?.pso_number || 'Pending PSO Filing'}</code>
                  </p>
                  <p className="text-slate-500">
                    Bank FDR 100% Escrow Pledge: <code className="text-gold-500">{group?.fdr_bank_guarantee_ref || 'Pending Escrow Deposit'}</code>
                  </p>
                  <p className="text-slate-500">
                    Dividend Distribution Policy: <code className="text-slate-700 dark:text-slate-300 font-bold">{group?.dividend_distribution_policy || 'NON_PRIZED_ONLY'}</code>
                  </p>
                </div>
              </div>)}

            {/* Tab 2: Members */}
            {activeTab === 'members' && (<div className="space-y-2 max-h-96 overflow-y-auto">
                {(detailData?.members || []).map((m) => (<div key={m.id} className="p-3 bg-white dark:bg-navy-950 border border-slate-100 dark:border-navy-800 rounded-card flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-gold-500/20 text-gold-500 flex items-center justify-center font-bold text-xs">
                        #{m.ticket_number}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{m.full_name}</span>
                        <span className="text-slate-500">{m.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.subscriber_status}/>
                    </div>
                  </div>))}
              </div>)}

            {/* Tab 3: Auctions */}
            {activeTab === 'auctions' && (<div className="space-y-2 max-h-96 overflow-y-auto">
                {(detailData?.auctions || []).map((a) => (<div key={a.id} className="p-3 bg-white dark:bg-navy-950 border border-slate-100 dark:border-navy-800 rounded-card flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        Month #{a.month_number} Auction
                      </span>
                      <span className="text-slate-500">
                        Winner: {a.winner_name ? `${a.winner_name} (Ticket #${a.winner_ticket_number})` : 'Not closed yet'}
                      </span>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={a.status}/>
                      {a.winning_bid_pct && (<span className="block font-bold text-gold-500 mt-1">Discount: {a.winning_bid_pct}%</span>)}
                    </div>
                  </div>))}
              </div>)}

            {/* Tab 4: Ledger */}
            {activeTab === 'ledger' && (<div className="space-y-2 max-h-96 overflow-y-auto">
                {(detailData?.ledger || []).map((l) => (<div key={l.id} className="p-3 bg-white dark:bg-navy-950 border border-slate-100 dark:border-navy-800 rounded-card flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {l.entry_type}
                      </span>
                      <span className="text-slate-500">
                        {l.subscriber_name ? `${l.subscriber_name} (Ticket #${l.ticket_number})` : 'Chit Group Pool'}
                      </span>
                    </div>
                    <div className="text-right font-bold text-slate-900 dark:text-slate-100">
                      <CurrencyText amount={l.amount}/>
                    </div>
                  </div>))}
              </div>)}
          </div>)}
      </Modal>
    </div>);
};
