import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { api } from '../api/client';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Pagination } from '../components/common/Pagination';
import { StatusBadge } from '../components/common/StatusBadge';
import { CurrencyText } from '../components/common/CurrencyText';
export const PaymentsPage = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-payments', page, pageSize, search, statusFilter],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/payments', {
                params: { page, limit: pageSize, q: search || undefined, status: statusFilter || undefined },
            });
            return res.data;
        },
    });
    const handleExportCsv = async () => {
        try {
            const res = await api.get('/api/v1/superadmin/payments', {
                params: { format: 'csv', status: statusFilter || undefined, q: search || undefined },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payments-export-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
        catch (err) {
            alert('Failed to export CSV');
        }
    };
    const columns = [
        {
            header: 'Subscriber & Group',
            accessorKey: 'subscriber_name',
            cell: (item) => (<div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            {item.subscriber_name || 'Subscriber'}
          </span>
          <span className="text-xs text-slate-500">
            {item.group_name || 'Chit Pool'} {item.ticket_number ? `(Ticket #${item.ticket_number})` : ''}
          </span>
        </div>),
        },
        {
            header: 'Amount Paid',
            accessorKey: 'amount',
            cell: (item) => <CurrencyText amount={item.amount} className="font-bold text-emerald-600 dark:text-emerald-400"/>,
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (item) => <StatusBadge status={item.status}/>,
        },
        {
            header: 'Razorpay Order ID',
            accessorKey: 'razorpay_order_id',
            cell: (item) => (<span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {item.razorpay_order_id || 'N/A'}
        </span>),
        },
        {
            header: 'Razorpay Payment ID',
            accessorKey: 'razorpay_payment_id',
            cell: (item) => (<span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {item.razorpay_payment_id || 'N/A'}
        </span>),
        },
        {
            header: 'Date & Time',
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
            Payments & Gateway Audit
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Reconcile subscriber installment collections with Razorpay payment gateway signatures.
          </p>
        </div>
        <button onClick={handleExportCsv} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 dark:bg-[#1A0C16] border border-stone-200/90 dark:border-maroon-800/60 text-stone-800 dark:text-stone-200 hover:border-gold-500/50 hover:text-gold-400 text-xs font-bold shadow-xs transition cursor-pointer backdrop-blur-sm">
          <Download className="w-4 h-4 text-gold-500"/>
          Export Payments (CSV)
        </button>
      </div>

      <div className="bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-5 backdrop-blur-md">
        <FilterBar searchQuery={search} onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
        }} searchPlaceholder="Search by subscriber, phone, or order ID...">
          <select value={statusFilter} onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
        }} className="text-xs py-2 px-3 bg-stone-50 dark:bg-[#1C0D18] border border-stone-200 dark:border-maroon-800/60 rounded-xl text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500">
            <option value="">All Payment Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="CREATED">Pending / Created</option>
            <option value="FAILED">Failed Payments</option>
          </select>
        </FilterBar>

        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} emptyTitle="No Payments Recorded"/>

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

