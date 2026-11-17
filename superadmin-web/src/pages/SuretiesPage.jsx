import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { CurrencyText } from '../components/common/CurrencyText';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Pagination } from '../components/common/Pagination';

const PAGE_SIZE = 10;

const TABS = [
  {
    key: 'review',
    label: 'Review Queue',
    hint: 'Pending vetting',
    accent: 'border-amber-500',
    emptyTitle: 'No sureties awaiting approval',
    emptyDescription: 'Submitted surety packages will appear here for vetting.',
    match: (i) => i.status === 'SUBMITTED' || i.status === 'PENDING',
  },
  {
    key: 'approved',
    label: 'Approved For Payout',
    hint: 'Ready for RTGS',
    accent: 'border-emerald-500',
    emptyTitle: 'No approved claims awaiting disbursal',
    emptyDescription: 'Approved sureties ready for RTGS payout will appear here.',
    match: (i) => i.status === 'APPROVED',
  },
  {
    key: 'completed',
    label: 'Completed Disbursals',
    hint: 'Prized subscribers (PS)',
    accent: 'border-purple-500',
    emptyTitle: 'No completed disbursals yet',
    emptyDescription: 'Prize payouts that have been released will appear here.',
    match: (i) => i.status === 'DISBURSED',
  },
];

export const SuretiesPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('review');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSuretyId, setSelectedSuretyId] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [disburseTarget, setDisburseTarget] = useState(null);
  // Bank form for disbursal
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [disburseError, setDisburseError] = useState('');

  // Fetch every page from the API (max 100 per request) so tab counts are always complete.
  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-sureties'],
    queryFn: async () => {
      const all = [];
      let p = 1;
      let totalPages = 1;
      do {
        const res = await api.get('/api/v1/superadmin/sureties', { params: { page: p, limit: 100 } });
        all.push(...(res.data.data || []));
        totalPages = res.data.meta?.totalPages || 1;
        p += 1;
      } while (p <= totalPages);
      return all;
    },
  });

  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['superadmin-surety-detail', selectedSuretyId],
    queryFn: async () => {
      if (!selectedSuretyId) return null;
      const res = await api.get(`/api/v1/superadmin/sureties/${selectedSuretyId}`);
      return res.data.data;
    },
    enabled: Boolean(selectedSuretyId),
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/api/v1/superadmin/sureties/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-sureties'] });
      setApproveTarget(null);
      setSelectedSuretyId(null);
    },
  });

  const disburseMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/api/v1/superadmin/sureties/${payload.id}/disburse`, {
        bankAccountNumber: payload.bankAccountNumber,
        bankIfsc: payload.bankIfsc,
        bankBeneficiaryName: payload.bankBeneficiaryName,
        paymentMode: 'RTGS',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-sureties'] });
      setDisburseTarget(null);
      setSelectedSuretyId(null);
    },
    onError: (err) => {
      setDisburseError(err.response?.data?.error || 'Disbursal execution failed');
    },
  });

  const items = data || [];

  // Count for each tab badge (unaffected by search)
  const counts = useMemo(() => {
    const result = {};
    TABS.forEach((t) => {
      result[t.key] = items.filter(t.match).length;
    });
    return result;
  }, [items]);

  const currentTab = TABS.find((t) => t.key === activeTab) || TABS[0];

  // Only the selected tab's list, then optional search
  const tabItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(currentTab.match).filter((i) => {
      if (!q) return true;
      return (
        String(i.subscriber_name || '').toLowerCase().includes(q) ||
        String(i.group_name || '').toLowerCase().includes(q) ||
        String(i.subscriber_phone || '').toLowerCase().includes(q)
      );
    });
  }, [items, currentTab, search]);

  const totalItems = tabItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const pageItems = tabItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Keep the page valid when the list shrinks (e.g. after approving an item)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const switchTab = (key) => {
    setActiveTab(key);
    setPage(1);
    setSearch('');
  };

  const columns = [
    {
      header: 'Subscriber',
      cell: (item) => (
        <div>
          <span className="font-black text-sm text-stone-900 dark:text-stone-100 block">{item.subscriber_name}</span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">{item.subscriber_phone}</span>
        </div>
      ),
    },
    {
      header: 'Chit Group',
      cell: (item) => (
        <div>
          <span className="font-semibold text-stone-800 dark:text-stone-200 block">{item.group_name}</span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">Ticket #{item.ticket_number}</span>
        </div>
      ),
    },
    {
      header: 'Net Prize Money',
      cell: (item) => (
        <CurrencyText amount={item.netPayoutAmount} className="font-black text-gold-500 dark:text-gold-400 text-sm" />
      ),
    },
    {
      header: 'Winning Discount',
      cell: (item) => (
        <span className="font-black text-stone-700 dark:text-stone-200">{item.winning_bid_pct}%</span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Action',
      cell: (item) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {item.status === 'SUBMITTED' && (
            <button
              onClick={() => setApproveTarget(item)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer transition whitespace-nowrap"
            >
              Approve Claim
            </button>
          )}
          {item.status === 'APPROVED' && (
            <button
              onClick={() => {
                setDisburseError('');
                setBeneficiary(item.subscriber_name || '');
                setAccountNo(item.bank_account_number || '');
                setIfsc(item.bank_ifsc || '');
                setDisburseTarget(item);
              }}
              className="px-3.5 py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-[#160812] shadow-sm shadow-gold-500/25 cursor-pointer transition whitespace-nowrap"
            >
              Execute RTGS Disbursal
            </button>
          )}
          {item.status === 'DISBURSED' && (
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 whitespace-nowrap">
              UTR: {item.utr_reference || 'VERIFIED'}
            </span>
          )}
          {item.status === 'PENDING' && (
            <span className="text-[11px] text-stone-400 font-medium whitespace-nowrap">Awaiting submission</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Sureties & Prize Disbursals
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Review co-guarantor credentials, CIBIL scores, and authorize direct RTGS prize payouts.
          </p>
        </div>
        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Fiduciary Underwriting Desk</span>
      </div>

      {/* Tabs: one list at a time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`text-left px-4 py-3 rounded-2xl border-b-4 border transition cursor-pointer ${tab.accent} ${isActive
                  ? 'bg-gold-500/10 border-x-gold-500/40 border-t-gold-500/40 shadow-sm'
                  : 'bg-white/60 dark:bg-[#150A11]/60 border-x-stone-200/80 border-t-stone-200/80 dark:border-x-maroon-900/40 dark:border-t-maroon-900/40 hover:bg-white dark:hover:bg-[#1C0D18]'
                }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-xs uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  {tab.label}
                </span>
                <span
                  className={`min-w-[1.75rem] text-center px-2 py-0.5 rounded-full text-xs font-black ${isActive ? 'bg-gold-500 text-[#160812]' : 'bg-stone-200/80 dark:bg-maroon-950 text-stone-700 dark:text-stone-300'
                    }`}
                >
                  {counts[tab.key] ?? 0}
                </span>
              </div>
              <span className="text-[11px] text-stone-400 font-medium">{tab.hint}</span>
            </button>
          );
        })}
      </div>

      {/* Selected list + pagination */}
      <div className="bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-5 backdrop-blur-md">
        <FilterBar
          searchQuery={search}
          onSearchChange={(q) => {
            setSearch(q);
            setPage(1);
          }}
          searchPlaceholder="Search by subscriber, phone or group..."
        />
        <DataTable
          columns={columns}
          data={pageItems}
          isLoading={isLoading}
          onRowClick={(item) => setSelectedSuretyId(item.id)}
          emptyTitle={search ? 'No matching results' : currentTab.emptyTitle}
          emptyDescription={search ? 'Try a different search term.' : currentTab.emptyDescription}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
        />
      </div>

      {/* Review Package Detail Modal */}
      <Modal isOpen={Boolean(selectedSuretyId)} onClose={() => setSelectedSuretyId(null)} title="Surety & Guarantor Security Package" maxWidth="2xl">
        {isDetailLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading security package...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Winning Subscriber</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">{detailData?.subscriber_name}</span>
                <span className="text-slate-500 font-mono block">{detailData?.subscriber_phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Net Prize Money</span>
                <CurrencyText amount={detailData?.netPayoutAmount} className="text-base font-bold text-gold-500" />
              </div>
            </div>

            {/* Guarantors */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                Co-Guarantors ({detailData?.guarantors?.length || 0})
              </h4>
              <div className="space-y-2">
                {(detailData?.guarantors || []).map((g) => (
                  <div key={g.id} className="p-3 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{g.full_name}</span>
                      <span className="text-slate-400">{g.relationship || 'Co-Applicant'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">CIBIL SCORE</span>
                      <span className="font-bold text-emerald-500">{g.cibil_score ? `${g.cibil_score}` : 'Pending Check'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">PAN NUMBER</span>
                      <span className="font-mono">{g.pan_number || 'Not Submitted'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                Supporting Security Documents
              </h4>
              {detailData?.documents && detailData.documents.length > 0 ? (
                <div className="space-y-2">
                  {detailData.documents.map((doc) => (
                    <div key={doc.id} className="p-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-gold-500" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {doc.document_type ? doc.document_type.replace(/_/g, ' ') : 'Security Document'}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {doc.title ? doc.title : 'Attached Verification Artifact'}
                          </span>
                        </div>
                      </div>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gold-500 hover:underline">
                          View &rarr;
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-2xl text-xs text-slate-500">
                  No uploaded document attachments on file for this surety package.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Disbursal Modal */}
      <Modal
        isOpen={Boolean(disburseTarget)}
        onClose={() => setDisburseTarget(null)}
        title="Execute RTGS Disbursal"
        maxWidth="md"
        footer={
          <>
            <button onClick={() => setDisburseTarget(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-input">
              Cancel
            </button>
            <button
              onClick={() => {
                if (!disburseTarget) return;
                disburseMutation.mutate({
                  id: disburseTarget.id,
                  bankAccountNumber: accountNo,
                  bankIfsc: ifsc,
                  bankBeneficiaryName: beneficiary,
                });
              }}
              disabled={disburseMutation.isPending}
              className="px-4 py-2 text-xs font-bold bg-gold-500 hover:bg-gold-400 text-navy-950 rounded-input shadow-sm"
            >
              {disburseMutation.isPending ? 'Processing RTGS...' : 'Confirm Disbursal'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Confirming will disburse <CurrencyText amount={disburseTarget?.netPayoutAmount} className="font-bold text-gold-500" /> to the beneficiary and transition the member from <span className="font-bold">Successful Bidder (SB)</span> to <span className="font-bold">Prized Subscriber (PS)</span>.
          </p>

          {disburseError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-input border border-rose-200">{disburseError}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Beneficiary Name</label>
            <input type="text" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} className="w-full p-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-stone-900 dark:text-stone-100" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank Account Number</label>
            <input type="text" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} className="w-full p-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-900 dark:text-slate-100 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank IFSC Code</label>
            <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value)} className="w-full p-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-900 dark:text-slate-100 font-mono" />
          </div>
        </div>
      </Modal>

      {/* Approve Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(approveTarget)}
        onClose={() => {
          approveMutation.reset();
          setApproveTarget(null);
        }}
        title="Approve Surety Package"
        message={`Approve submitted co-guarantor and security package for ${approveTarget?.subscriber_name}? This prepares the prize money for RTGS disbursal.${approveMutation.isError ? ` FAILED: ${approveMutation.error?.response?.data?.error || approveMutation.error?.message || 'Unknown error'}` : ''}`}
        confirmText="Approve Surety"
        isLoading={approveMutation.isPending}
        onConfirm={() => {
          if (!approveTarget) return;
          approveMutation.mutate(approveTarget.id);
        }}
      />
    </div>
  );
};
