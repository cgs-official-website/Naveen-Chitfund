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
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-payments', page, search, statusFilter],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/payments', {
                params: { page, limit: 10, q: search || undefined, status: statusFilter || undefined },
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Payments & Gateway Audit</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reconcile subscriber installment collections with Razorpay payment gateway signatures.
          </p>
        </div>
        <button onClick={handleExportCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 text-xs font-semibold shadow-xs transition">
          <Download className="w-4 h-4 text-gold-500"/>
          Export Payments (CSV)
        </button>
      </div>

      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-card shadow-sm p-4">
        <FilterBar searchQuery={search} onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
        }} searchPlaceholder="Search by subscriber, phone, or order ID...">
          <select value={statusFilter} onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
        }} className="text-xs py-2 px-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-700 dark:text-slate-200">
            <option value="">All Payment Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="CREATED">Created</option>
            <option value="FAILED">Failed</option>
          </select>
        </FilterBar>

        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} emptyTitle="No Payments Recorded"/>

        <Pagination currentPage={page} totalPages={data?.meta?.totalPages || 1} totalItems={data?.meta?.total || 0} pageSize={10} onPageChange={setPage}/>
      </div>
    </div>);
};
