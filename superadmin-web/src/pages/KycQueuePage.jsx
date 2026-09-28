import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, XCircle, CheckCircle, FileText } from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
export const KycQueuePage = () => {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [approveTarget, setApproveTarget] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-kyc-queue'],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/kyc', {
                params: { status: 'PENDING' },
            });
            return res.data.data;
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
    const users = data || [];
    const activeUser = selectedUser || users[0] || null;
    return (<div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Member eKYC Verification Queue</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Validate Aadhaar & PAN credentials in compliance with the DPDP Act 2023.
        </p>
      </div>

      {users.length === 0 && !isLoading ? (<EmptyState title="All Caught Up!" description="There are currently no pending subscriber KYC applications awaiting manual review." icon={UserCheck}/>) : (<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Queue List (4 cols on lg) */}
          <div className="lg:col-span-5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-card shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Pending Applications ({users.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {users.map((u) => {
                const isSelected = activeUser?.id === u.id;
                return (<div key={u.id} onClick={() => setSelectedUser(u)} className={`p-3.5 rounded-card border cursor-pointer transition ${isSelected
                        ? 'border-gold-500 bg-gold-50/50 dark:bg-gold-500/10'
                        : 'border-slate-200 dark:border-navy-800 hover:border-slate-300 dark:hover:border-navy-700'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{u.full_name}</span>
                      <StatusBadge status={u.kyc_status}/>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <span className="font-mono">{u.phone}</span>
                      <span>{new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>);
            })}
            </div>
          </div>

          {/* Right Column: Split Document Preview (7 cols on lg) */}
          <div className="lg:col-span-7 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-card shadow-sm p-6 flex flex-col justify-between">
            {activeUser ? (<div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-navy-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{activeUser.full_name}</h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{activeUser.phone}</p>
                  </div>
                  <StatusBadge status={activeUser.kyc_status}/>
                </div>

                {/* Identity Information Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
                    <span className="text-slate-400 block font-semibold mb-1">Declared PAN Number</span>
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                      {activeUser.pan_number || 'ABCDE1234F'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
                    <span className="text-slate-400 block font-semibold mb-1">Aadhaar Vault Token</span>
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                      AVR-9988-TS-4411
                    </span>
                  </div>
                </div>

                {/* Mock DigiLocker / Aadhaar Document Viewer */}
                <div className="p-6 rounded-card border-2 border-dashed border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-950/40 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gold-500/20 text-gold-500 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6"/>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    DigiLocker XML Signature Verified
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Aadhaar e-KYC payload validated against UIDAI central registry with OTP timestamp verification.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-navy-800">
                  <button onClick={() => setRejectTarget(activeUser)} className="px-5 py-2.5 rounded-input border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition flex items-center gap-2">
                    <XCircle className="w-4 h-4"/> Reject Application
                  </button>
                  <button onClick={() => setApproveTarget(activeUser)} className="px-5 py-2.5 rounded-input bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4"/> Approve Member KYC
                  </button>
                </div>
              </div>) : (<div className="p-12 text-center text-slate-400 text-xs">Select an applicant to review</div>)}
          </div>
        </div>)}

      {/* Reject Confirm Dialog with Mandatory Reason */}
      <ConfirmDialog isOpen={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} title="Reject KYC Application" message={`Are you sure you want to reject the KYC verification for ${rejectTarget?.full_name}? A mandatory justification is required for regulatory compliance.`} confirmText="Reject Application" isDestructive requireReason reasonPlaceholder="e.g. Unclear PAN image, mismatched name with Aadhaar..." isLoading={reviewMutation.isPending} onConfirm={(reason) => {
            if (!rejectTarget)
                return;
            reviewMutation.mutate({
                id: rejectTarget.id,
                status: 'REJECTED',
                reason,
            });
        }}/>

      {/* Approve Confirm Dialog */}
      <ConfirmDialog isOpen={Boolean(approveTarget)} onClose={() => setApproveTarget(null)} title="Approve Member KYC" message={`Confirm approval of ${approveTarget?.full_name}? The user will be authorized to participate in live auctions and enroll in new chit groups.`} confirmText="Confirm Approval" isLoading={reviewMutation.isPending} onConfirm={() => {
            if (!approveTarget)
                return;
            reviewMutation.mutate({
                id: approveTarget.id,
                status: 'APPROVED',
            });
        }}/>
    </div>);
};
