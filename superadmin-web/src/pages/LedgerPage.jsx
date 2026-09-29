import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { api } from '../api/client';
import { DataTable } from '../components/common/DataTable';
import { Pagination } from '../components/common/Pagination';
import { StatusBadge } from '../components/common/StatusBadge';
import { CurrencyText } from '../components/common/CurrencyText';
export const LedgerPage = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [entryType, setEntryType] = useState('ALL');
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-ledger', page, pageSize, entryType],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/ledger', {
                params: { page, limit: pageSize, entryType: entryType !== 'ALL' ? entryType : undefined },
            });
            return res.data;
        },
    });
    const handleExportCsv = async () => {
        try {
            const res = await api.get('/api/v1/superadmin/ledger', {
                params: { format: 'csv', entryType: entryType !== 'ALL' ? entryType : undefined },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `double-entry-ledger-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
        catch {
            alert('Failed to export CSV');
        }
    };
    const totals = data?.meta?.totalsByEntryType || {};
    const columns = [
        {
            header: 'Entry Classification',
            accessorKey: 'entry_type',
            cell: (item) => <StatusBadge status={item.entry_type}/>,
        },
        {
            header: 'Chit Group & Member',
            accessorKey: 'group_name',
            cell: (item) => (<div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            {item.group_name || 'Global Pool'}
          </span>
          <span className="text-xs text-slate-500">
            {item.subscriber_name ? `${item.subscriber_name} (#${item.ticket_number})` : 'Foreman Account'}
          </span>
        </div>),
        },
        {
            header: 'Amount (INR)',
            accessorKey: 'amount',
            cell: (item) => <CurrencyText amount={item.amount} className="font-bold"/>,
        },
        {
            header: 'Integer-Paise Precision',
            accessorKey: 'amount_paise',
            cell: (item) => (<span className="font-mono text-xs text-stone-500 dark:text-stone-400">
          {Number(item.amount_paise).toLocaleString()} paise
        </span>),
        },
        {
            header: 'Timestamp',
            accessorKey: 'created_at',
            cell: (item) => (<span className="text-xs text-slate-500">
          {new Date(item.created_at).toLocaleString()}
        </span>),
        },
    ];
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Immutable Double-Entry Ledger
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Zero-drift integer-paise financial bookkeeping for installments, dividends, and prize disbursals.
          </p>
        </div>
        <button onClick={handleExportCsv} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 dark:bg-[#1A0C16] border border-stone-200/90 dark:border-maroon-800/60 text-stone-800 dark:text-stone-200 hover:border-gold-500/50 hover:text-gold-400 text-xs font-bold shadow-xs transition cursor-pointer backdrop-blur-sm">
          <Download className="w-4 h-4 text-gold-500"/>
          Export Ledger (CSV)
        </button>
      </div>

      {/* Aggregate Totals Band */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 shadow-sm text-xs backdrop-blur-md">
        <div className="p-3 rounded-xl bg-stone-50/60 dark:bg-[#1C0D17]/60 border border-stone-200/60 dark:border-maroon-900/40">
          <span className="text-stone-400 block font-bold text-[10px] uppercase tracking-wider">Installments Inflow</span>
          <CurrencyText amount={totals.INSTALLMENT?.amountRupees || 0} className="text-lg font-black text-emerald-600 dark:text-emerald-400"/>
        </div>
        <div className="p-3 rounded-xl bg-stone-50/60 dark:bg-[#1C0D17]/60 border border-stone-200/60 dark:border-maroon-900/40">
          <span className="text-stone-400 block font-bold text-[10px] uppercase tracking-wider">Dividends Credited</span>
          <CurrencyText amount={totals.DIVIDEND?.amountRupees || 0} className="text-lg font-black text-blue-600 dark:text-blue-400"/>
        </div>
        <div className="p-3 rounded-xl bg-stone-50/60 dark:bg-[#1C0D17]/60 border border-stone-200/60 dark:border-maroon-900/40">
          <span className="text-stone-400 block font-bold text-[10px] uppercase tracking-wider">Prize Payouts</span>
          <CurrencyText amount={totals.PRIZE_PAYOUT?.amountRupees || 0} className="text-lg font-black text-purple-600 dark:text-purple-400"/>
        </div>
        <div className="p-3 rounded-xl bg-stone-50/60 dark:bg-[#1C0D17]/60 border border-stone-200/60 dark:border-maroon-900/40">
          <span className="text-stone-400 block font-bold text-[10px] uppercase tracking-wider">Foreman Commission</span>
          <CurrencyText amount={totals.COMMISSION?.amountRupees || 0} className="text-lg font-black text-gold-600 dark:text-gold-400"/>
        </div>
      </div>

      {/* Filter Chips & Table */}
      <div className="bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-5 space-y-4 backdrop-blur-md">
        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'INSTALLMENT', 'DIVIDEND', 'PRIZE_PAYOUT', 'COMMISSION'].map((type) => (<button key={type} onClick={() => {
                setEntryType(type);
                setPage(1);
            }} className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${entryType === type
                ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-[#160812] shadow-sm shadow-gold-500/25 ring-1 ring-gold-400'
                : 'bg-stone-100 dark:bg-[#1E0D19] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-maroon-900/50'}`}>
              {type === 'ALL' ? 'All Entries' : type.replace(/_/g, ' ')}
            </button>))}
        </div>

        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} emptyTitle="No Ledger Entries"/>

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

