import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Download } from 'lucide-react';
import { api } from '../api/client';
import { CurrencyText } from '../components/common/CurrencyText';
import { Modal } from '../components/common/Modal';
export const CompliancePage = () => {
    const [selectedFormXivAuctionId, setSelectedFormXivAuctionId] = useState(null);
    const [selectedGstAuctionId, setSelectedGstAuctionId] = useState(null);
    // 48h Filing Tracker
    const { data: trackerData, isLoading: isTrackerLoading } = useQuery({
        queryKey: ['superadmin-compliance-filing-tracker'],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/compliance/filing-tracker');
            return res.data.data;
        },
    });
    // Form XIV data
    const { data: formXivData, isLoading: isFormXivLoading } = useQuery({
        queryKey: ['superadmin-form-xiv', selectedFormXivAuctionId],
        queryFn: async () => {
            if (!selectedFormXivAuctionId)
                return null;
            const res = await api.get(`/api/v1/superadmin/compliance/form-xiv/${selectedFormXivAuctionId}`);
            return res.data.data;
        },
        enabled: Boolean(selectedFormXivAuctionId),
    });
    // GST Invoice data
    const { data: gstData, isLoading: isGstLoading } = useQuery({
        queryKey: ['superadmin-gst-invoice', selectedGstAuctionId],
        queryFn: async () => {
            if (!selectedGstAuctionId)
                return null;
            const res = await api.get(`/api/v1/superadmin/compliance/gst-invoice/${selectedGstAuctionId}`);
            return res.data.data;
        },
        enabled: Boolean(selectedGstAuctionId),
    });
    return (<div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Statutory Compliance & Regulatory Filing</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor Section 18 48-hour filing deadlines, generate Form XIV minutes, and inspect GST invoices.
        </p>
      </div>

      {/* 48-Hour Filing Tracker Section */}
      <div className="bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-gold-500"/>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Section 18 Filing Tracker (48-Hour Statutory Window)
            </h2>
          </div>
          <span className="text-xs text-slate-400">Registrar of Chits Mandate</span>
        </div>

        <div className="space-y-3">
          {(trackerData || []).map((t) => (<div key={t.id} className="p-4 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {t.group_name} (Month #{t.month_number})
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.isOverdue ? 'bg-rose-500 text-white' : 'bg-amber-500 text-navy-950'}`}>
                    {t.isOverdue ? 'Filing Overdue' : `${t.hoursRemaining}h ${t.minutesRemaining}m Remaining`}
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  Winner: {t.winner_name || 'Designated Subscriber'} • Winning Discount: {t.winning_bid_pct}%
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedFormXivAuctionId(t.id)} className="px-3 py-1.5 rounded-input bg-navy-900 dark:bg-navy-800 text-gold-400 font-bold border border-gold-500/30 hover:bg-navy-800 text-xs shadow-xs">
                  Generate Form XIV
                </button>
                <button onClick={() => setSelectedGstAuctionId(t.id)} className="px-3 py-1.5 rounded-input bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300">
                  GST Invoice
                </button>
              </div>
            </div>))}
          {(!trackerData || trackerData.length === 0) && !isTrackerLoading && (<div className="p-8 text-center text-xs text-slate-400">No completed auctions pending filing</div>)}
        </div>
      </div>

      {/* Form XIV Modal */}
      <Modal isOpen={Boolean(selectedFormXivAuctionId)} onClose={() => setSelectedFormXivAuctionId(null)} title="Form XIV — Minutes of Chit Auction (§ 18 Chit Funds Act, 1982)" maxWidth="2xl" footer={<button onClick={() => window.print()} className="px-4 py-2 rounded-input bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs flex items-center gap-1.5 shadow-sm">
            <Download className="w-4 h-4"/> Print / Export PDF
          </button>}>
        {isFormXivLoading ? (<div className="p-8 text-center text-slate-400 text-xs animate-pulse">Generating Form XIV...</div>) : (<div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-2xl space-y-1.5">
              <div className="font-bold text-sm text-gold-600 dark:text-gold-400">{formXivData?.formName}</div>
              <div className="text-slate-500">Statutory Reference: {formXivData?.statutoryReference}</div>
              <div className="text-slate-500">Filing Token: {formXivData?.minutesFilingReference}</div>
              <div className="text-slate-500">Conducted: {formXivData?.auctionProceedings?.conductedAt}</div>
            </div>

            <div className="border border-slate-200 dark:border-navy-800 rounded-2xl p-4 space-y-2">
              <span className="font-bold block text-stone-900 dark:text-stone-100">Proceedings Summary</span>
              <p>Chit Amount: <CurrencyText amount={formXivData?.chitGroup?.chitAmount}/></p>
              <p>Winning Bid Discount: {formXivData?.auctionProceedings?.winningBidDiscountPct}% (<CurrencyText amount={formXivData?.auctionProceedings?.discountOfferedRupees}/>)</p>
              <p>Foreman Commission (5%): <CurrencyText amount={formXivData?.auctionProceedings?.foremanCommissionRupees}/></p>
              <p className="text-emerald-500 font-bold">Net Prize Disbursable: <CurrencyText amount={formXivData?.auctionProceedings?.netPrizeMoneyDisbursable}/></p>
              <p className="text-gold-500 font-bold">Dividend Pool: <CurrencyText amount={formXivData?.auctionProceedings?.totalDividendDistributable}/></p>
            </div>

            <div className="p-3 bg-navy-950 text-slate-300 rounded text-[11px] space-y-1">
              <span className="font-bold text-gold-400 block">Digital Signature Cryptographic Hash:</span>
              <span className="break-all">{formXivData?.dscStatus} • {formXivData?.superadminReviewAudit}</span>
            </div>
          </div>)}
      </Modal>

      {/* GST Invoice Modal */}
      <Modal isOpen={Boolean(selectedGstAuctionId)} onClose={() => setSelectedGstAuctionId(null)} title="Statutory GST Tax Invoice (Notification 11/2017)" maxWidth="lg" footer={<button onClick={() => window.print()} className="px-4 py-2 rounded-input bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs flex items-center gap-1.5 shadow-sm">
            <Download className="w-4 h-4"/> Download GST Invoice
          </button>}>
        {isGstLoading ? (<div className="p-8 text-center text-slate-400 text-xs animate-pulse">Generating GST Invoice...</div>) : (<div className="space-y-4 text-xs font-mono">
            <div className="flex justify-between border-b border-slate-200 dark:border-navy-800 pb-3">
              <div>
                <span className="font-bold block text-sm">{gstData?.supplier?.legalName}</span>
                <span className="text-slate-500">GSTIN: {gstData?.supplier?.gstin}</span>
              </div>
              <div className="text-right">
                <span className="font-bold">{gstData?.invoiceNumber}</span>
                <span className="block text-slate-500">{gstData?.invoiceDate}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded border border-slate-200 dark:border-navy-800 space-y-1">
              <div>Service: {gstData?.itemDescription}</div>
              <div>SAC Code: {gstData?.hsnSacCode}</div>
              <div>Taxable Value: <CurrencyText amount={gstData?.taxableValue} className="font-bold"/></div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between">
                <span>CGST (9%):</span>
                <CurrencyText amount={gstData?.cgst?.amount}/>
              </div>
              <div className="flex justify-between">
                <span>SGST (9%):</span>
                <CurrencyText amount={gstData?.sgst?.amount}/>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-navy-800 pt-2 font-bold text-sm">
                <span>Total Invoice Value:</span>
                <CurrencyText amount={gstData?.totalInvoiceAmount} className="text-gold-500"/>
              </div>
            </div>

            <div className="p-2.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px]">
              {gstData?.complianceNote}
            </div>
          </div>)}
      </Modal>
    </div>);
};

