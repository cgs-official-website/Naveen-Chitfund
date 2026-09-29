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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Statutory Compliance & Regulatory Filing
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Surveil Section 18 48-hour filing countdowns, execute Form XIV minutes, and audit GST tax invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            48h Registrar Filing Window
          </span>
        </div>
      </div>

      {/* 48-Hour Filing Tracker Section */}
      <div className="bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm p-6 space-y-5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-500/20 text-gold-500 flex items-center justify-center border border-gold-400/30">
              <Clock className="w-4 h-4 text-gold-500"/>
            </div>
            <h2 className="text-sm font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              Section 18 Filing Tracker (48-Hour Statutory Window)
            </h2>
          </div>
          <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Registrar of Chits Mandate</span>
        </div>

        <div className="space-y-3.5">
          {(trackerData || []).map((t) => (<div key={t.id} className="p-4.5 bg-stone-50/80 dark:bg-[#180B14] border border-stone-200/80 dark:border-maroon-900/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs transition hover:border-gold-500/40">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-black text-sm text-stone-900 dark:text-stone-100">
                    {t.group_name} (Month #{t.month_number})
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${t.isOverdue ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'}`}>
                    {t.isOverdue ? 'Filing Overdue' : `${t.hoursRemaining}h ${t.minutesRemaining}m Remaining`}
                  </span>
                </div>
                <p className="text-stone-500 dark:text-stone-400 mt-1">
                  Winner: {t.winner_name || 'Designated Subscriber'} • Winning Discount: <span className="font-black text-gold-600 dark:text-gold-400">{t.winning_bid_pct}%</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedFormXivAuctionId(t.id)} className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-[#160812] font-black text-xs shadow-sm shadow-gold-500/20 transition cursor-pointer">
                  Generate Form XIV
                </button>
                <button onClick={() => setSelectedGstAuctionId(t.id)} className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-[#25101E] border border-stone-200/80 dark:border-maroon-800/60 text-stone-700 dark:text-stone-200 font-bold text-xs hover:border-gold-500/40 transition cursor-pointer">
                  GST Invoice
                </button>
              </div>
            </div>))}
          {(!trackerData || trackerData.length === 0) && !isTrackerLoading && (<div className="p-8 text-center text-xs text-stone-400 rounded-2xl border border-dashed border-stone-200 dark:border-maroon-900/50">No completed auctions pending filing</div>)}
        </div>
      </div>

      {/* Form XIV Modal */}
      <Modal isOpen={Boolean(selectedFormXivAuctionId)} onClose={() => setSelectedFormXivAuctionId(null)} title="Form XIV — Minutes of Chit Auction (§ 18 Chit Funds Act, 1982)" maxWidth="2xl" footer={<button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-maroon-950 font-black text-xs flex items-center gap-2 shadow-md shadow-gold-500/25 cursor-pointer transition">
            <Download className="w-4 h-4"/> Print / Export Statutory PDF
          </button>}>
        {isFormXivLoading ? (<div className="p-8 text-center text-stone-400 text-xs animate-pulse">Generating Form XIV...</div>) : (<div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-stone-50/80 dark:bg-[#1A0B14] border border-stone-200/80 dark:border-maroon-900/50 rounded-2xl space-y-1.5">
              <div className="font-black text-sm text-gold-600 dark:text-gold-400">{formXivData?.formName}</div>
              <div className="text-stone-500 dark:text-stone-400">Statutory Reference: {formXivData?.statutoryReference}</div>
              <div className="text-stone-500 dark:text-stone-400">Filing Token: {formXivData?.minutesFilingReference}</div>
              <div className="text-stone-500 dark:text-stone-400">Conducted: {formXivData?.auctionProceedings?.conductedAt}</div>
            </div>

            <div className="border border-stone-200/80 dark:border-maroon-900/50 rounded-2xl p-4 space-y-2 bg-white/50 dark:bg-black/20">
              <span className="font-black block text-stone-900 dark:text-stone-100 uppercase tracking-wider text-[11px]">Proceedings Summary</span>
              <p>Chit Amount: <CurrencyText amount={formXivData?.chitGroup?.chitAmount}/></p>
              <p>Winning Bid Discount: {formXivData?.auctionProceedings?.winningBidDiscountPct}% (<CurrencyText amount={formXivData?.auctionProceedings?.discountOfferedRupees}/>)</p>
              <p>Foreman Commission (5%): <CurrencyText amount={formXivData?.auctionProceedings?.foremanCommissionRupees}/></p>
              <p className="text-emerald-500 font-black">Net Prize Disbursable: <CurrencyText amount={formXivData?.auctionProceedings?.netPrizeMoneyDisbursable}/></p>
              <p className="text-gold-500 font-black">Dividend Pool: <CurrencyText amount={formXivData?.auctionProceedings?.totalDividendDistributable}/></p>
            </div>

            <div className="p-3.5 bg-black/40 text-stone-300 rounded-xl text-[11px] space-y-1 border border-maroon-900/40">
              <span className="font-bold text-gold-400 block">Digital Signature Cryptographic Hash:</span>
              <span className="break-all font-mono text-[10px] text-stone-400">{formXivData?.dscStatus} • {formXivData?.superadminReviewAudit}</span>
            </div>
          </div>)}
      </Modal>

      {/* GST Invoice Modal */}
      <Modal isOpen={Boolean(selectedGstAuctionId)} onClose={() => setSelectedGstAuctionId(null)} title="Statutory GST Tax Invoice (Notification 11/2017)" maxWidth="lg" footer={<button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-maroon-950 font-black text-xs flex items-center gap-2 shadow-md shadow-gold-500/25 cursor-pointer transition">
            <Download className="w-4 h-4"/> Download Tax Invoice
          </button>}>
        {isGstLoading ? (<div className="p-8 text-center text-stone-400 text-xs animate-pulse">Generating GST Invoice...</div>) : (<div className="space-y-4 text-xs font-mono">
            <div className="flex justify-between border-b border-stone-200 dark:border-maroon-900/50 pb-3">
              <div>
                <span className="font-black block text-sm text-stone-900 dark:text-stone-100">{gstData?.supplier?.legalName}</span>
                <span className="text-stone-500">GSTIN: {gstData?.supplier?.gstin}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-gold-500">{gstData?.invoiceNumber}</span>
                <span className="block text-stone-500 text-[11px]">{gstData?.invoiceDate}</span>
              </div>
            </div>

            <div className="p-3.5 bg-stone-50/80 dark:bg-[#1A0B14] rounded-xl border border-stone-200/80 dark:border-maroon-900/50 space-y-1">
              <div>Service: {gstData?.itemDescription}</div>
              <div>SAC Code: {gstData?.hsnSacCode}</div>
              <div>Taxable Value: <CurrencyText amount={gstData?.taxableValue} className="font-black text-stone-900 dark:text-stone-100"/></div>
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
              <div className="flex justify-between border-t border-stone-200 dark:border-maroon-900/50 pt-2 font-black text-sm">
                <span>Total Invoice Value:</span>
                <CurrencyText amount={gstData?.totalInvoiceAmount} className="text-gold-500"/>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-[11px]">
              {gstData?.complianceNote}
            </div>
          </div>)}
      </Modal>
    </div>);
};

