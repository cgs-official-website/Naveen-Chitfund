import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Gavel, ChevronDown, Layers, ArrowRight, Calculator, Lock, FileCheck2, Percent, ShieldCheck, } from 'lucide-react';
import { CurrencyText } from '../components/common/CurrencyText';
export const LandingPage = () => {
    const [openFaq, setOpenFaq] = useState(null);
    const faqs = [
        {
            q: 'Is Naveen Chit Fund legally registered and regulated?',
            a: 'Yes. Every chit group operates under strict compliance with the Chit Funds Act, 1982 (Central Amendments 2019), with 100% Fixed Deposit Receipts (FDR) pledged with the State Registrar to secure all subscriber funds before a Prior Sanction Order (PSO) is issued.',
        },
        {
            q: 'How does the monthly live reverse auction work?',
            a: 'Eligible subscribers place bids online in real time by offering a discount percentage (between the 5% minimum floor and the 40% statutory cap). The member offering the highest discount receives the net prize money that month.',
        },
        {
            q: 'How are subscriber dividends calculated?',
            a: 'The total discount offered by the auction winner minus the statutory 5% foreman commission forms the distributable dividend pool. This is divided equally among all eligible members and directly credited against their next monthly installment.',
        },
        {
            q: 'What securities or guarantors are required after winning an auction?',
            a: 'Under Section 31 of the Chit Funds Act, the winning subscriber (Successful Bidder) submits standard financial security—such as salaried co-guarantors, property deeds, or bank guarantees—to safeguard future installments before prize money is disbursed via RTGS.',
        },
        {
            q: 'How is GST handled on chit funds?',
            a: 'In accordance with GST Notification No. 11/2017, 18% GST applies exclusively to the 5% foreman commission. Principal contributions and subscriber dividends are strictly 100% exempt from GST.',
        },
    ];
    return (<div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-gold-500 selection:text-navy-950">
      {/* 1. Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-navy-950/90 backdrop-blur-md border-b border-navy-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Naveen Chit Logo" className="w-10 h-10 rounded-xl object-contain shadow-md" />
            <div>
              <span className="text-xl font-extrabold tracking-wider text-white">NAVEEN CHIT</span>
              <span className="block text-[10px] text-gold-400 font-bold uppercase tracking-widest">
                Digital Chit Fund Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#how-it-works" className="hover:text-gold-400 transition">How It Works</a>
            <a href="#features" className="hover:text-gold-400 transition">Features</a>
            <a href="#compliance" className="hover:text-gold-400 transition">Statutory Trust</a>
            <a href="#faqs" className="hover:text-gold-400 transition">FAQs</a>
          </nav>

          <Link to="/chit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-input bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-gold-500/20 transition-transform active:scale-95">
            <Lock className="w-4 h-4"/>
            Superadmin Login
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-slate-900">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#C9A227_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-800/80 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping"></span>
            Govt. Regulated • Chit Funds Act 1982 Compliant
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
            Institutional-Grade <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-200">
              Digital Chit Fund Platform
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
            Digitizing rotating credit & savings (ROSCAs) with real-time reverse auctions, integer-paise dividend precision, 100% bank FDR guarantees, and immutable double-entry ledger bookkeeping.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/chit" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-input bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-sm tracking-wide shadow-lg shadow-gold-500/25 transition">
              Access Superadmin Console <ArrowRight className="w-4 h-4"/>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-input bg-navy-800/80 hover:bg-navy-800 border border-slate-700 text-white font-semibold text-sm transition">
              Explore Chit Mechanics
            </a>
          </div>
        </div>
      </section>

      {/* 3. Trust Strip */}
      <section id="compliance" className="border-y border-navy-800/80 bg-navy-950/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-xl md:text-2xl font-bold text-gold-400">Chit Funds Act 1982</span>
            <span className="text-xs text-slate-400 mt-1">2019 Central Amendments</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl md:text-2xl font-bold text-gold-400">100% FDR Pledged</span>
            <span className="text-xs text-slate-400 mt-1">Scheduled Bank Guarantee</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl md:text-2xl font-bold text-gold-400">DPDP Act 2023</span>
            <span className="text-xs text-slate-400 mt-1">Strict Consent Ledger</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl md:text-2xl font-bold text-gold-400">Form XIV Certified</span>
            <span className="text-xs text-slate-400 mt-1">48-Hour Minutes Filing</span>
          </div>
        </div>
      </section>

      {/* 4. Features Grid */}
      <section id="features" className="py-24 bg-navy-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-gold-400 uppercase tracking-widest">Enterprise Architecture</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">Full-Stack Digital ROSCA Engine</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-card bg-navy-950/80 border border-navy-800 shadow-sm hover:border-gold-500/40 transition">
              <div className="w-12 h-12 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center mb-6">
                <Gavel className="w-6 h-6"/>
              </div>
              <h3 className="text-lg font-bold text-white">Real-Time Reverse Auctions</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Low-latency WebSocket room bidding with Redis circular bid deduplication, interactive circular dial controls, and automated 40% statutory cap validation.
              </p>
            </div>

            <div className="p-8 rounded-card bg-navy-950/80 border border-navy-800 shadow-sm hover:border-gold-500/40 transition">
              <div className="w-12 h-12 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center mb-6">
                <Calculator className="w-6 h-6"/>
              </div>
              <h3 className="text-lg font-bold text-white">Integer-Paise Precision</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Zero floating-point rounding error bookkeeping. All subscriber dividend allocations, installment discounts, and commission deductions are computed in exact integer paise.
              </p>
            </div>

            <div className="p-8 rounded-card bg-navy-950/80 border border-navy-800 shadow-sm hover:border-gold-500/40 transition">
              <div className="w-12 h-12 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6"/>
              </div>
              <h3 className="text-lg font-bold text-white">Immutable Double-Entry Ledger</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Relational transaction safety with ACID row locking. Every installment, dividend, foreman commission, and prize disbursal is fully auditable.
              </p>
            </div>

            <div className="p-8 rounded-card bg-navy-950/80 border border-navy-800 shadow-sm hover:border-gold-500/40 transition">
              <div className="w-12 h-12 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6"/>
              </div>
              <h3 className="text-lg font-bold text-white">Surety & RTGS Disbursal</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Comprehensive post-auction security verification module with co-guarantor CIBIL assessment, Cloudinary document vetting, and direct RTGS disbursal with UTR tracking.
              </p>
            </div>

            <div className="p-8 rounded-card bg-navy-950/80 border border-navy-800 shadow-sm hover:border-gold-500/40 transition">
              <div className="w-12 h-12 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center mb-6">
                <FileCheck2 className="w-6 h-6"/>
              </div>
              <h3 className="text-lg font-bold text-white">Statutory Form XIV Minutes</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Automated regulatory filings generated within the statutory 48-hour post-auction window for the Registrar of Chits, complete with digital signature tracking.
              </p>
            </div>

            <div className="p-8 rounded-card bg-navy-950/80 border border-navy-800 shadow-sm hover:border-gold-500/40 transition">
              <div className="w-12 h-12 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center mb-6">
                <Percent className="w-6 h-6"/>
              </div>
              <h3 className="text-lg font-bold text-white">GST Notification 11/2017</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Automated tax invoice generation applying 18% GST strictly to the 5% foreman commission, never on subscriber pool capital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. "How a Chit Works" 4-Step Timeline with Math Example */}
      <section id="how-it-works" className="py-24 bg-navy-950 border-t border-navy-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-gold-400 uppercase tracking-widest">Financial Transparency</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">How a Chit Fund Operates</p>
            <p className="mt-4 text-sm text-slate-400">
              Examining the exact math of a ₹5,00,000 chit group across 20 months with 20 subscribers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-card bg-navy-900 border border-navy-800 relative">
              <div className="w-8 h-8 rounded-full bg-gold-500 text-navy-950 font-black flex items-center justify-center text-sm mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-white">Monthly Pool</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                20 members contribute ₹25,000 each per month to create a total monthly capital pool of <CurrencyText amount={500000} className="text-gold-300 font-bold"/>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-card bg-navy-900 border border-navy-800 relative">
              <div className="w-8 h-8 rounded-full bg-gold-500 text-navy-950 font-black flex items-center justify-center text-sm mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-white">Reverse Auction</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Members bid discounts (5% to 40%). If winning bid is 25%, discount is <CurrencyText amount={125000} className="text-gold-300 font-bold"/>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-card bg-navy-900 border border-navy-800 relative">
              <div className="w-8 h-8 rounded-full bg-gold-500 text-navy-950 font-black flex items-center justify-center text-sm mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-white">Foreman & Dividend</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Foreman takes 5% (<CurrencyText amount={25000}/>). Remaining <CurrencyText amount={100000}/> is distributed as dividend among subscribers.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-card bg-navy-900 border border-navy-800 relative">
              <div className="w-8 h-8 rounded-full bg-gold-500 text-navy-950 font-black flex items-center justify-center text-sm mb-4">
                4
              </div>
              <h4 className="text-base font-bold text-white">Prize Money Payout</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Winner takes home <CurrencyText amount={375000} className="text-emerald-400 font-bold"/> after submitting sureties. Future installments offset by dividends!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Stats Band */}
      <section className="py-16 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border-y border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-5xl font-black text-gold-400">100%</div>
            <div className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-semibold">Statutory FDR Reserve</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-black text-white">0.00%</div>
            <div className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-semibold">Floating-Point Drift</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-black text-gold-400">40%</div>
            <div className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-semibold">Statutory Bid Cap</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-black text-white">&lt; 48h</div>
            <div className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-semibold">Form XIV Regulatory Filing</div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Accordion */}
      <section id="faqs" className="py-24 bg-navy-900/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-gold-400 uppercase tracking-widest">Questions & Answers</h2>
            <p className="mt-2 text-3xl font-extrabold text-white">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (<div key={idx} className="rounded-card bg-navy-950/80 border border-navy-800 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white hover:text-gold-300 transition">
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gold-500 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`}/>
                </button>
                {openFaq === idx && (<div className="p-5 pt-0 text-sm text-slate-400 border-t border-navy-900/60 leading-relaxed">
                    {faq.a}
                  </div>)}
              </div>))}
          </div>
        </div>
      </section>

      {/* 8. Footer with Legal Links */}
      <footer className="mt-auto border-t border-navy-800 bg-navy-950 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Naveen Chit Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-bold text-white">Naveen Chit Fund Private Limited</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <span>GSTIN: 36AAACC1206K1ZF</span>
            <span>CIN: U65992TS2024PTC180123</span>
            <span>ROC Hyderabad (Telangana)</span>
            <span>Chit Funds Act 1982 Registered</span>
          </div>

          <div className="text-slate-500 text-center md:text-right">
            &copy; {new Date().getFullYear()} Naveen Chit Fund. All statutory rights reserved.
          </div>
        </div>
      </footer>
    </div>);
};
