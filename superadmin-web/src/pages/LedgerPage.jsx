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
    const [entryType, setEntryType] = useState('ALL');
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-ledger', page, entryType],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/ledger', {
                params: { page, limit: 15, entryType: entryType !== 'ALL' ? entryType : undefined },
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
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Immutable Double-Entry Ledger</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zero-drift integer-paise financial bookkeeping for installments, dividends, and prize disbursals.
          </p>
        </div>
        <button onClick={handleExportCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 text-xs font-semibold shadow-xs transition">
          <Download className="w-4 h-4 text-gold-500"/>
          Export Ledger (CSV)
        </button>
      </div>

      {/* Aggregate Totals Band */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 shadow-sm text-xs">
        <div>
          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Installments Inflow</span>
          <CurrencyText amount={totals.INSTALLMENT?.amountRupees || 0} className="text-base font-bold text-emerald-600 dark:text-emerald-400"/>
        </div>
        <div>
          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Dividends Credited</span>
          <CurrencyText amount={totals.DIVIDEND?.amountRupees || 0} className="text-base font-bold text-blue-600 dark:text-blue-400"/>
        </div>
        <div>
          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Prize Payouts</span>
          <CurrencyText amount={totals.PRIZE_PAYOUT?.amountRupees || 0} className="text-base font-bold text-purple-600 dark:text-purple-400"/>
        </div>
        <div>
          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Foreman Commission</span>
          <CurrencyText amount={totals.COMMISSION?.amountRupees || 0} className="text-base font-bold text-gold-600 dark:text-gold-400"/>
        </div>
      </div>

      {/* Filter Chips & Table */}
      <div className="bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-4 space-y-4">
        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'INSTALLMENT', 'DIVIDEND', 'PRIZE_PAYOUT', 'COMMISSION'].map((type) => (<button key={type} onClick={() => {
                setEntryType(type);
                setPage(1);
            }} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${entryType === type
                ? 'bg-gold-500 text-navy-950 shadow-sm'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'}`}>
              {type === 'ALL' ? 'All Entries' : type.replace(/_/g, ' ')}
            </button>))}
        </div>

        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} emptyTitle="No Ledger Entries"/>

        <Pagination currentPage={page} totalPages={data?.meta?.totalPages || 1} totalItems={data?.meta?.total || 0} pageSize={15} onPageChange={setPage}/>
      </div>
    </div>);
};

