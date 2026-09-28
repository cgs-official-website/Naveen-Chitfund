import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { CurrencyText } from '../components/common/CurrencyText';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
export const SuretiesPage = () => {
    const queryClient = useQueryClient();
    const [selectedSuretyId, setSelectedSuretyId] = useState(null);
    const [approveTarget, setApproveTarget] = useState(null);
    const [disburseTarget, setDisburseTarget] = useState(null);
    // Bank form for disbursal
    const [accountNo, setAccountNo] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [beneficiary, setBeneficiary] = useState('');
    const [disburseError, setDisburseError] = useState('');
    const { data, isLoading } = useQuery({
        queryKey: ['superadmin-sureties'],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/sureties');
            return res.data.data;
        },
    });
    const { data: detailData, isLoading: isDetailLoading } = useQuery({
        queryKey: ['superadmin-surety-detail', selectedSuretyId],
        queryFn: async () => {
            if (!selectedSuretyId)
                return null;
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
    // Group by Kanban status
    const submittedItems = items.filter((i) => i.status === 'SUBMITTED' || i.status === 'PENDING');
    const approvedItems = items.filter((i) => i.status === 'APPROVED');
    const disbursedItems = items.filter((i) => i.status === 'DISBURSED');
    const renderCard = (item) => (<div key={item.id} onClick={() => setSelectedSuretyId(item.id)} className="p-4 bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-xs hover:border-gold-500/50 cursor-pointer transition space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
            {item.subscriber_name}
          </span>
          <span className="text-xs text-slate-500">{item.group_name} (Ticket #{item.ticket_number})</span>
        </div>
        <StatusBadge status={item.status}/>
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-navy-800/80">
        <div>
          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Net Prize Money</span>
          <CurrencyText amount={item.netPayoutAmount} className="font-bold text-gold-500 text-sm"/>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block font-semibold text-[10px] uppercase">Winning Discount</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">{item.winning_bid_pct}%</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
        {item.status === 'SUBMITTED' && (<button onClick={() => setApproveTarget(item)} className="px-2.5 py-1 text-xs font-bold rounded-input bg-emerald-600 hover:bg-emerald-500 text-white">
            Approve
          </button>)}
        {item.status === 'APPROVED' && (<button onClick={() => {
                setBeneficiary(item.subscriber_name || '');
                setAccountNo(item.bank_account_number || '');
                setIfsc(item.bank_ifsc || '');
                setDisburseTarget(item);
            }} className="px-2.5 py-1 text-xs font-bold rounded-input bg-gold-500 hover:bg-gold-400 text-navy-950">
            Execute RTGS Disbursal
          </button>)}
        {item.status === 'DISBURSED' && (<span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            UTR: {item.utr_reference || 'VERIFIED'}
          </span>)}
      </div>
    </div>);
    return (<div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Sureties & Prize Disbursals</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review co-guarantor credentials, CIBIL scores, and authorize direct RTGS prize payouts.
        </p>
      </div>

      {/* Desktop Kanban View (>=1024px) / Mobile Column Stack (<1024px) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Submitted */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-amber-500">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Review Queue ({submittedItems.length})
            </h3>
            <span className="text-xs text-slate-400 font-medium">Pending Vetting</span>
          </div>
          <div className="space-y-3">
            {submittedItems.map(renderCard)}
            {submittedItems.length === 0 && (<div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-navy-800">
                No sureties awaiting approval
              </div>)}
          </div>
        </div>

        {/* Column 2: Approved */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-500">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Approved For Payout ({approvedItems.length})
            </h3>
            <span className="text-xs text-slate-400 font-medium">Ready for RTGS</span>
          </div>
          <div className="space-y-3">
            {approvedItems.map(renderCard)}
            {approvedItems.length === 0 && (<div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-navy-800">
                No approved claims awaiting disbursal
              </div>)}
          </div>
        </div>

        {/* Column 3: Disbursed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-purple-500">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Completed Disbursals ({disbursedItems.length})
            </h3>
            <span className="text-xs text-slate-400 font-medium">Prized Subscribers (PS)</span>
          </div>
          <div className="space-y-3">
            {disbursedItems.map(renderCard)}
            {disbursedItems.length === 0 && (<div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-navy-800">
                No completed disbursals yet
              </div>)}
          </div>
        </div>
      </div>

      {/* Review Package Detail Modal */}
      <Modal isOpen={Boolean(selectedSuretyId)} onClose={() => setSelectedSuretyId(null)} title="Surety & Guarantor Security Package" maxWidth="2xl">
        {isDetailLoading ? (<div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading security package...</div>) : (<div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Winning Subscriber</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">{detailData?.subscriber_name}</span>
                <span className="text-slate-500 font-mono block">{detailData?.subscriber_phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Net Prize Money</span>
                <CurrencyText amount={detailData?.netPayoutAmount} className="text-base font-bold text-gold-500"/>
              </div>
            </div>

            {/* Guarantors */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                Co-Guarantors ({detailData?.guarantors?.length || 0})
              </h4>
              <div className="space-y-2">
                {(detailData?.guarantors || []).map((g) => (<div key={g.id} className="p-3 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-2xl grid grid-cols-3 gap-2 text-xs">
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
                  </div>))}
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
                        <FileText className="w-4 h-4 text-gold-500"/>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {doc.document_type ? doc.document_type.replace(/_/g, ' ') : 'Security Document'}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {doc.document_number ? `Ref: ${doc.document_number}` : 'Attached Verification Artifact'}
                          </span>
                        </div>
                      </div>
                      {doc.document_url && (
                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gold-500 hover:underline">
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
          </div>)}
      </Modal>

      {/* Disbursal Modal */}
      <Modal isOpen={Boolean(disburseTarget)} onClose={() => setDisburseTarget(null)} title="Execute RTGS Disbursal" maxWidth="md" footer={<>
            <button onClick={() => setDisburseTarget(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-input">
              Cancel
            </button>
            <button onClick={() => {
                if (!disburseTarget)
                    return;
                disburseMutation.mutate({
                    id: disburseTarget.id,
                    bankAccountNumber: accountNo,
                    bankIfsc: ifsc,
                    bankBeneficiaryName: beneficiary,
                });
            }} disabled={disburseMutation.isPending} className="px-4 py-2 text-xs font-bold bg-gold-500 hover:bg-gold-400 text-navy-950 rounded-input shadow-sm">
              {disburseMutation.isPending ? 'Processing RTGS...' : 'Confirm Disbursal'}
            </button>
          </>}>
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Confirming will disburse <CurrencyText amount={disburseTarget?.netPayoutAmount} className="font-bold text-gold-500"/> to the beneficiary and transition the member from <span className="font-bold">Successful Bidder (SB)</span> to <span className="font-bold">Prized Subscriber (PS)</span>.
          </p>

          {disburseError && (<div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-input border border-rose-200">
              {disburseError}
            </div>)}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Beneficiary Name</label>
            <input type="text" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} className="w-full p-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-stone-900 dark:text-stone-100"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank Account Number</label>
            <input type="text" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} className="w-full p-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-900 dark:text-slate-100 font-mono"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank IFSC Code</label>
            <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value)} className="w-full p-2.5 text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-900 dark:text-slate-100 font-mono"/>
          </div>
        </div>
      </Modal>

      {/* Approve Confirm Dialog */}
      <ConfirmDialog isOpen={Boolean(approveTarget)} onClose={() => setApproveTarget(null)} title="Approve Surety Package" message={`Approve submitted co-guarantor and security package for ${approveTarget?.subscriber_name}? This prepares the prize money for RTGS disbursal.`} confirmText="Approve Surety" isLoading={approveMutation.isPending} onConfirm={() => {
            if (!approveTarget)
                return;
            approveMutation.mutate(approveTarget.id);
        }}/>
    </div>);
};

