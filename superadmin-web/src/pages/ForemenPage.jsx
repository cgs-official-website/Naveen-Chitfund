import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Building } from 'lucide-react';
import { api } from '../api/client';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Pagination } from '../components/common/Pagination';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { CurrencyText } from '../components/common/CurrencyText';
export const ForemenPage = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedForeman, setSelectedForeman] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [toggleStatusTarget, setToggleStatusTarget] = useState(null);
    // Form state
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [addError, setAddError] = useState('');
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-foremen', page, search],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/foremen', {
                params: { page, limit: 10, q: search || undefined },
            });
            return res.data;
        },
    });
    const { data: detailData, isLoading: isDetailLoading } = useQuery({
        queryKey: ['superadmin-foreman-detail', selectedForeman?.id],
        queryFn: async () => {
            if (!selectedForeman?.id)
                return null;
            const res = await api.get(`/api/v1/superadmin/foremen/${selectedForeman.id}`);
            return res.data.data;
        },
        enabled: Boolean(selectedForeman?.id),
    });
    // Create Foreman Mutation
    const createMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/api/v1/superadmin/foremen', payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-foremen'] });
            setIsAddOpen(false);
            setNewName('');
            setNewPhone('');
            setAddError('');
        },
        onError: (err) => {
            setAddError(err.response?.data?.error || 'Failed to create foreman');
        },
    });
    // Status Toggle Mutation
    const statusMutation = useMutation({
        mutationFn: async ({ id, status, reason }) => {
            const res = await api.patch(`/api/v1/superadmin/foremen/${id}`, { status, reason });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-foremen'] });
            setToggleStatusTarget(null);
        },
    });
    const columns = [
        {
            header: 'Foreman Name',
            accessorKey: 'full_name',
            cell: (item) => (<div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building className="w-4 h-4 text-gold-500 shrink-0"/>
          <span>{item.full_name}</span>
        </div>),
        },
        {
            header: 'Contact Phone',
            accessorKey: 'phone',
            cell: (item) => <span className="font-mono text-xs">{item.phone}</span>,
        },
        {
            header: 'Operational Status',
            accessorKey: 'kyc_status',
            cell: (item) => <StatusBadge status={item.kyc_status === 'APPROVED' ? 'ACTIVE' : 'SUSPENDED'}/>,
        },
        {
            header: 'Created On',
            accessorKey: 'created_at',
            cell: (item) => (<span className="text-xs text-slate-500">
          {new Date(item.created_at).toLocaleDateString()}
        </span>),
        },
        {
            header: 'Actions',
            cell: (item) => {
                const isActive = item.kyc_status === 'APPROVED';
                return (<div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => {
                        setSelectedForeman(item);
                        setIsDetailOpen(true);
                    }} className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline px-2 py-1">
              Details
            </button>
            <button onClick={() => setToggleStatusTarget(item)} className={`text-xs font-semibold px-2 py-1 rounded-input border transition ${isActive
                        ? 'border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40'
                        : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/40'}`}>
              {isActive ? 'Suspend' : 'Activate'}
            </button>
          </div>);
            },
        },
    ];
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Foremen Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authorize and govern regional chit fund managers and statutory license holders.
          </p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs uppercase tracking-wide shadow-sm transition">
          <UserPlus className="w-4 h-4"/>
          Add Authorized Foreman
        </button>
      </div>

      {/* Filter and Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-card shadow-sm p-4">
        <FilterBar searchQuery={search} onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
        }} searchPlaceholder="Search foremen by name or phone..."/>

        <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} onRowClick={(item) => {
            setSelectedForeman(item);
            setIsDetailOpen(true);
        }} emptyTitle="No Foremen Found" emptyDescription="No registered chit foremen match your current search criteria."/>

        <Pagination currentPage={page} totalPages={data?.meta?.totalPages || 1} totalItems={data?.meta?.total || 0} pageSize={10} onPageChange={setPage}/>
      </div>

      {/* Add Foreman Modal */}
      <Modal isOpen={isAddOpen} onClose={() => {
            setIsAddOpen(false);
            setAddError('');
        }} title="Register Authorized Foreman" maxWidth="md" footer={<>
            <button onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-input">
              Cancel
            </button>
            <button onClick={() => {
                if (!newName || !newPhone) {
                    setAddError('Full name and phone number are required');
                    return;
                }
                createMutation.mutate({ fullName: newName, phone: newPhone });
            }} disabled={createMutation.isPending} className="px-4 py-2 text-sm font-bold bg-gold-500 hover:bg-gold-400 text-navy-950 rounded-input shadow-sm">
              {createMutation.isPending ? 'Registering...' : 'Create Foreman'}
            </button>
          </>}>
        <div className="space-y-4">
          {addError && (<div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs rounded-input">
              {addError}
            </div>)}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Legal Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Ramesh Chandra (Director)" className="w-full p-2.5 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-900 dark:text-slate-100"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Mobile (+91)</label>
            <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+919876543210" className="w-full p-2.5 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-900 dark:text-slate-100"/>
          </div>
        </div>
      </Modal>

      {/* Foreman Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => {
            setIsDetailOpen(false);
            setSelectedForeman(null);
        }} title={`Foreman: ${selectedForeman?.full_name || ''}`} maxWidth="lg">
        {isDetailLoading ? (<div className="space-y-3 p-4">
            <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded animate-pulse"></div>
          </div>) : (<div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-card bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-navy-800 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Phone Number</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{selectedForeman?.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">License Status</span>
                <StatusBadge status={selectedForeman?.kyc_status === 'APPROVED' ? 'ACTIVE' : 'SUSPENDED'}/>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                Managed Chit Groups & Bank FDR Guarantees
              </h4>
              <div className="space-y-2">
                {(detailData?.groups || []).map((grp) => (<div key={grp.id} className="p-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-card flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{grp.name}</span>
                      <span className="text-slate-500">
                        Tenure: {grp.duration_months} mo • Value: <CurrencyText amount={grp.chit_amount}/>
                      </span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-navy-800 text-gold-600 dark:text-gold-400">
                      FDR: {grp.fdr_bank_guarantee_ref || 'PLEDGED-100%'}
                    </span>
                  </div>))}
              </div>
            </div>
          </div>)}
      </Modal>

      {/* Suspend/Activate Confirm Dialog with Mandatory Reason */}
      <ConfirmDialog isOpen={Boolean(toggleStatusTarget)} onClose={() => setToggleStatusTarget(null)} title={toggleStatusTarget?.kyc_status === 'APPROVED' ? 'Suspend Foreman' : 'Activate Foreman'} message={`Are you sure you want to ${toggleStatusTarget?.kyc_status === 'APPROVED' ? 'suspend' : 'activate'} ${toggleStatusTarget?.full_name}? A mandatory justification is required for audit logs.`} confirmText={toggleStatusTarget?.kyc_status === 'APPROVED' ? 'Suspend' : 'Activate'} isDestructive={toggleStatusTarget?.kyc_status === 'APPROVED'} requireReason reasonPlaceholder="e.g. Regulatory inquiry under Section 19 or annual license renewal..." isLoading={statusMutation.isPending} onConfirm={(reason) => {
            if (!toggleStatusTarget)
                return;
            const nextStatus = toggleStatusTarget.kyc_status === 'APPROVED' ? 'SUSPENDED' : 'ACTIVE';
            statusMutation.mutate({
                id: toggleStatusTarget.id,
                status: nextStatus,
                reason,
            });
        }}/>
    </div>);
};
