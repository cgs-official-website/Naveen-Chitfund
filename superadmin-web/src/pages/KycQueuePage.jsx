import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { UserCheck, XCircle, CheckCircle, FileText } from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';

const PAGE_SIZE = 10;

const TABS = [
  {
    key: 'foremen',
    role: 'admin',
    label: 'KYC Approvals for Foremen',
    hint: 'Chit organizers awaiting review',
    accent: 'border-amber-500',
    approveText: 'Approve Foreman KYC',
    emptyDescription: 'There are currently no pending foreman KYC applications awaiting manual review.',
  },
  {
    key: 'subscribers',
    role: 'user',
    label: 'KYC Approvals for Subscribers',
    hint: 'Chit members awaiting review',
    accent: 'border-emerald-500',
    approveText: 'Approve Member KYC',
    emptyDescription: 'There are currently no pending subscriber KYC applications awaiting manual review.',
  },
];

export const KycQueuePage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('foremen');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);

  const currentTab = TABS.find((t) => t.key === activeTab) || TABS[0];

  // Pending list for the selected tab: 10 per page, paginated by the server
  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-kyc-queue', 'list', currentTab.role, page],
    queryFn: async () => {
      const res = await api.get('/api/v1/superadmin/kyc', {
        params: { status: 'PENDING', role: currentTab.role, page, limit: PAGE_SIZE },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  // Pending counts for both tab badges
  const { data: counts } = useQuery({
    queryKey: ['superadmin-kyc-queue', 'counts'],
    queryFn: async () => {
      const results = await Promise.all(
        TABS.map((t) =>
          api.get('/api/v1/superadmin/kyc', { params: { status: 'PENDING', role: t.role, page: 1, limit: 1 } })
        )
      );
      const out = {};
      TABS.forEach((t, i) => {
        out[t.key] = results[i].data.meta?.total || 0;
      });
      return out;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, reason }) => {
      const res = await api.patch(`/api/v1/superadmin/kyc/${id}/review`, { status, reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-kyc-queue'] });
      setApproveTarget(null);
      setRejectTarget(null);
      setSelectedUser(null);
    },
  });

  const users = data?.data || [];
  const totalItems = data?.meta?.total || 0;
  const totalPages = Math.max(1, data?.meta?.totalPages || 1);
  const activeUser = users.find((u) => u.id === selectedUser?.id) || users[0] || null;

  // If the last item on a page is reviewed, step back to a valid page
  useEffect(() => {
    if (!isLoading && page > totalPages) setPage(totalPages);
  }, [isLoading, page, totalPages]);

  const switchTab = (key) => {
    setActiveTab(key);
    setPage(1);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            eKYC Verification Queue
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Validate Aadhaar & PAN credentials in compliance with the DPDP Act 2023 & statutory Chit regulations.
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">DPDP Compliant Masking</span>
      </div>

      {/* Two heads: Foremen / Subscribers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  {counts?.[tab.key] ?? 0}
                </span>
              </div>
              <span className="text-[11px] text-stone-400 font-medium">{tab.hint}</span>
            </button>
          );
        })}
      </div>

      {users.length === 0 && !isLoading ? (
        <EmptyState title="All Caught Up!" description={currentTab.emptyDescription} icon={UserCheck} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          {/* Left Column: Queue List + pagination */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-4 sm:p-5 space-y-3 backdrop-blur-md">
              <h3 className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                Pending Applications ({totalItems})
              </h3>
              <div className="space-y-2.5">
                {isLoading && users.length === 0 && (
                  <div className="p-6 text-center text-xs text-stone-400 animate-pulse">Loading applications...</div>
                )}
                {users.map((u) => {
                  const isSelected = activeUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${isSelected
                          ? 'border-gold-500 bg-gradient-to-r from-gold-500/10 via-amber-500/5 to-transparent ring-1 ring-gold-400/30 shadow-xs'
                          : 'border-stone-200/70 dark:border-maroon-900/40 hover:border-gold-500/40 bg-white/80 dark:bg-[#180C14]'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-black text-sm text-stone-900 dark:text-stone-100">{u.full_name}</span>
                        <StatusBadge status={u.kyc_status} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mt-2">
                        <span className="font-mono">{u.phone}</span>
                        <span>{new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => {
                setPage(Math.min(Math.max(1, p), totalPages));
                setSelectedUser(null);
              }}
            />
          </div>

          {/* Right Column: Document / identity review */}
          <div className="lg:col-span-7 self-start bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col justify-between backdrop-blur-md">
            {activeUser ? (
              <div className="space-y-5 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-stone-100 dark:border-maroon-900/40 pb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">{activeUser.full_name}</h2>
                    <p className="text-xs text-stone-500 font-mono mt-0.5">{activeUser.phone}</p>
                  </div>
                  <StatusBadge status={activeUser.kyc_status} className="self-start sm:self-auto" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 bg-stone-50/80 dark:bg-[#1A0B14] border border-stone-200/60 dark:border-maroon-900/40 rounded-xl">
                    <span className="text-stone-400 block font-bold text-[11px] uppercase tracking-wider mb-1">Declared PAN Number</span>
                    <span className="font-mono text-sm font-black text-stone-900 dark:text-stone-100">
                      {activeUser.pan_number || 'Not Submitted'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-stone-50/80 dark:bg-[#1A0B14] border border-stone-200/60 dark:border-maroon-900/40 rounded-xl">
                    <span className="text-stone-400 block font-bold text-[11px] uppercase tracking-wider mb-1">Aadhaar Identity Ref</span>
                    <span className="font-mono text-sm font-black text-stone-900 dark:text-stone-100">
                      {activeUser.aadhaar_number
                        ? `XXXX-XXXX-${String(activeUser.aadhaar_number).slice(-4)}`
                        : activeUser.id
                          ? `UID-${activeUser.id.substring(0, 8).toUpperCase()}`
                          : 'Pending Submission'}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-maroon-900/50 bg-stone-50/50 dark:bg-[#1A0B14]/60 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-500 flex items-center justify-center shrink-0 border border-gold-400/30">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-stone-800 dark:text-stone-200">
                        {activeUser.pan_number ? 'PAN Document Validated' : 'Profile Awaiting Full Identity Artifacts'}
                      </h4>
                      <p className="text-xs text-stone-500">
                        Enrolled on {new Date(activeUser.created_at).toLocaleDateString()} • Role: {activeUser.role === 'admin' ? 'Foreman' : 'Subscriber'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-stone-200/60 dark:border-maroon-900/40">
                    <div>
                      <span className="text-stone-400 block text-[11px] font-bold">System Identifier</span>
                      <span className="font-mono text-stone-700 dark:text-stone-300 text-[11px] truncate block">{activeUser.id}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px] font-bold">Review Pipeline</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{activeUser.kyc_status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-maroon-900/40 flex-wrap">
                  <button
                    onClick={() => setRejectTarget(activeUser)}
                    className="px-5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Reject Application
                  </button>
                  <button
                    onClick={() => setApproveTarget(activeUser)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> {currentTab.approveText}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-stone-400 text-xs">Select an applicant from the queue to review</div>
            )}
          </div>
        </div>
      )}

      {/* Reject Confirm Dialog with Mandatory Reason */}
      <ConfirmDialog
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject KYC Application"
        message={`Are you sure you want to reject the KYC verification for ${rejectTarget?.full_name}? A mandatory justification is required for regulatory compliance.`}
        confirmText="Reject Application"
        isDestructive
        requireReason
        reasonPlaceholder="e.g. Unclear PAN image, mismatched name with Aadhaar..."
        isLoading={reviewMutation.isPending}
        onConfirm={(reason) => {
          if (!rejectTarget) return;
          reviewMutation.mutate({ id: rejectTarget.id, status: 'REJECTED', reason });
        }}
      />

      {/* Approve Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        title={currentTab.approveText}
        message={`Confirm approval of ${approveTarget?.full_name}? ${currentTab.role === 'admin'
            ? 'The foreman will be authorized to create and run chit groups.'
            : 'The user will be authorized to participate in live auctions and enroll in new chit groups.'
          }`}
        confirmText="Confirm Approval"
        isLoading={reviewMutation.isPending}
        onConfirm={() => {
          if (!approveTarget) return;
          reviewMutation.mutate({ id: approveTarget.id, status: 'APPROVED' });
        }}
      />
    </div>
  );
};
