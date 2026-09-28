import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Gavel,
  ChevronDown,
  Layers,
  ArrowRight,
  Calculator,
  Lock,
  FileCheck2,
  Percent,
  ShieldCheck,
  Download,
  Smartphone,
  CheckCircle,
  TrendingUp,
  Users,
  Clock,
  Play,
  Star,
  Sparkles,
  ArrowUpRight,
  CreditCard,
  Building,
  CheckCircle2,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { CurrencyText } from '../components/common/CurrencyText';

export const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [calcChitAmount, setCalcChitAmount] = useState(500000);
  const [calcTenure, setCalcTenure] = useState(20);
  const [calcDiscountPct, setCalcDiscountPct] = useState(25);

  // Dynamic calculations for the interactive Chit Calculator
  const monthlyInstallment = Math.round(calcChitAmount / calcTenure);
  const discountAmount = Math.round((calcChitAmount * calcDiscountPct) / 100);
  const foremanCommission = Math.round((calcChitAmount * 5) / 100);
  const dividendPool = Math.max(0, discountAmount - foremanCommission);
  const dividendPerMember = Math.round(dividendPool / calcTenure);
  const netInstallmentDue = monthlyInstallment - dividendPerMember;
  const netPrizeMoney = calcChitAmount - discountAmount;

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

  return (
    <div className="min-h-screen bg-[#F4EFE6] p-2 sm:p-4 md:p-6 lg:p-8 flex justify-center selection:bg-gold-500 selection:text-maroon-950 font-sans">
      {/* Outer Card Enclosure matching the reference design frame */}
      <div className="w-full max-w-[1360px] bg-[#FAF8F5] text-slate-900 rounded-[28px] sm:rounded-[38px] shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col">
        
        {/* ========================================================= */}
        {/* 1. TOP NAVBAR                                             */}
        {/* ========================================================= */}
        <header className="px-6 sm:px-10 lg:px-12 py-5 sm:py-6 flex items-center justify-between border-b border-stone-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-50">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Naveen Chit Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-sm border border-gold-300/40"
            />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#4E1327]">
              Naveen Chit
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-semibold text-stone-600">
            <a href="#features" className="hover:text-[#7A1F3D] transition">Features</a>
            <a href="#how-it-works" className="hover:text-[#7A1F3D] transition">How It Works</a>
            <a href="#app-showcase" className="hover:text-[#7A1F3D] transition">Mobile App</a>
            <a href="#calculator" className="hover:text-[#7A1F3D] transition">Yield Calculator</a>
            <a href="#compliance" className="hover:text-[#7A1F3D] transition">Statutory Trust</a>
            <a href="#faqs" className="hover:text-[#7A1F3D] transition">FAQs</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/chit"
              className="text-xs sm:text-sm font-bold text-stone-700 hover:text-[#7A1F3D] transition px-2 py-1"
            >
              Login
            </Link>
            <Link
              to="/chit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4E1327] hover:bg-[#7A1F3D] text-[#FFFDF9] font-bold text-xs uppercase tracking-wider shadow-md shadow-maroon-900/10 transition-transform active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-gold-400" />
              Superadmin Portal
            </Link>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. HERO SECTION (With Central Floating Phone Mockup)      */}
        {/* ========================================================= */}
        <section className="relative px-6 sm:px-10 lg:px-16 pt-10 sm:pt-14 pb-16 sm:pb-20 overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#FDFBF7] to-[#F5ECE0]">
          {/* Social Proof Pill */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/90 border border-stone-200/90 shadow-sm text-xs font-semibold text-stone-700">
              <div className="flex -space-x-1.5 overflow-hidden">
                <span className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-[#7A1F3D] text-[9px] font-bold text-white flex items-center justify-center">AS</span>
                <span className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-[#C9A227] text-[9px] font-bold text-navy-950 flex items-center justify-center">PS</span>
                <span className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-[#2E7D4F] text-[9px] font-bold text-white flex items-center justify-center">RK</span>
              </div>
              <span>Over <strong className="text-[#4E1327]">10,000+</strong> members saving with Naveen Chit Fund</span>
              <div className="flex text-amber-500 text-[10px]">
                ★★★★★
              </div>
            </div>
          </div>

          {/* Hero Typography with Integrated Phone Mockup */}
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="relative">
              {/* Massive 3-Line Title matching reference design */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-black text-[#360D1B] tracking-[-0.035em] leading-[1.05] max-w-4xl mx-auto">
                Control Your <br />
                Chit Fund And <br />
                Finance Easily
              </h1>

              {/* Floating Phone positioned centrally in Hero */}
              <div className="my-8 sm:my-10 flex justify-center">
                <div className="w-[280px] sm:w-[320px] rounded-[44px] bg-[#160C10] p-3 shadow-2xl shadow-maroon-900/30 border-[6px] border-stone-900/90 transform hover:-translate-y-1 transition duration-500">
                  {/* Phone Screen Container */}
                  <div className="rounded-[36px] bg-[#FFFDF9] overflow-hidden text-left text-slate-900 border border-stone-200/60 font-sans">
                    {/* Status Bar */}
                    <div className="px-5 pt-3 pb-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
                      <span>9:41</span>
                      <div className="w-16 h-3.5 bg-black rounded-full mx-auto -mt-1"></div>
                      <div className="flex items-center gap-1">
                        <span>5G</span>
                        <div className="w-3.5 h-2 border border-slate-700 rounded-xs flex items-center p-0.5">
                          <div className="w-full h-full bg-slate-700"></div>
                        </div>
                      </div>
                    </div>

                    {/* App Header */}
                    <div className="px-4 py-2 flex items-center justify-between border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="w-6 h-6 rounded-md" />
                        <div>
                          <div className="text-[11px] font-bold text-[#4E1327] leading-tight">Naveen Chit Fund</div>
                          <div className="text-[9px] text-stone-400">Govt. Regulated ROSCA</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        VERIFIED
                      </span>
                    </div>

                    {/* Balance Card inside Phone */}
                    <div className="p-4 bg-gradient-to-br from-[#4E1327] via-[#7A1F3D] to-[#9C2A50] text-white">
                      <span className="text-[10px] text-gold-300 font-semibold uppercase tracking-wider block">
                        Active Pool • Gold Tier 20M
                      </span>
                      <div className="text-2xl font-black tracking-tight text-white mt-0.5">
                        ₹4,75,250<span className="text-xs text-gold-300 font-normal">.00</span>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-[10px] text-white/90 pt-2 border-t border-white/10">
                        <span>Your Ticket: <strong className="text-gold-300">#07</strong></span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Auction Live (02:14)
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 border-b border-stone-100 text-center">
                      <div className="p-2 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                        <div className="text-[10px] font-bold text-[#7A1F3D]">Bid 24%</div>
                        <div className="text-[8px] text-stone-400 mt-0.5">Place Bid</div>
                      </div>
                      <div className="p-2 rounded-xl bg-[#7A1F3D] text-white shadow-xs">
                        <div className="text-[10px] font-bold text-gold-300">Pay Due</div>
                        <div className="text-[8px] text-white/80 mt-0.5">₹20,125</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                        <div className="text-[10px] font-bold text-stone-700">Ledger</div>
                        <div className="text-[8px] text-stone-400 mt-0.5">0.00 drift</div>
                      </div>
                    </div>

                    {/* Active Feed Item */}
                    <div className="p-3 space-y-2">
                      <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-emerald-950 block">Dividend Credited</span>
                          <span className="text-[9px] text-emerald-700">Month #4 Auction Offset</span>
                        </div>
                        <span className="font-bold text-emerald-700">+₹4,875</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-slate-800 block">Leading Discount Bid</span>
                          <span className="text-[9px] text-stone-400">Ticket #12 (Bid: 24.5%)</span>
                        </div>
                        <span className="font-bold text-gold-600">₹3,75,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtitle */}
              <p className="mt-4 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed font-normal">
                Introducing Naveen Chit Fund, India's premier digital ROSCA savings and credit platform.
                Participate in 100% bank-guaranteed chit funds, save with high dividend yields, and borrow
                instantly via transparent, real-time reverse auctions.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#360D1B] hover:bg-[#4E1327] text-white font-bold text-sm tracking-wide shadow-lg shadow-maroon-950/20 transition-all hover:scale-105"
                >
                  <span>Explore Active Chits</span>
                  <div className="w-5 h-5 rounded-full bg-[#7A1F3D] flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5 text-gold-300" />
                  </div>
                </a>

                <Link
                  to="/chit"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-semibold text-sm transition shadow-sm"
                >
                  <Lock className="w-4 h-4 text-[#7A1F3D]" />
                  <span>Superadmin Console</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. TRUST & METRICS STRIP (Soft Card matching reference)   */}
          {/* ========================================================= */}
          <div className="max-w-5xl mx-auto mt-14 sm:mt-16 bg-white/95 rounded-[26px] p-6 sm:p-8 border border-stone-200/90 shadow-md">
            {/* Top Partner Strip inside pill */}
            <div className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-maroon-500/10 to-emerald-500/10 border border-gold-300/40 text-center mb-6">
              <span className="text-[11px] sm:text-xs font-bold text-[#4E1327] uppercase tracking-wider">
                Trusted by 10,000+ subscribers across Telangana & Andhra Pradesh • Registered Under Chit Funds Act, 1982
              </span>
            </div>

            {/* Regulatory Partners row */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pb-6 border-b border-stone-100 text-xs font-semibold text-stone-500">
              <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-[#7A1F3D]" /> ROC Telangana</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#C9A227]" /> 100% Bank FDR</span>
              <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-emerald-600" /> Razorpay Secured</span>
              <span className="flex items-center gap-1.5"><FileCheck2 className="w-4 h-4 text-blue-600" /> Form XIV Certified</span>
              <span className="flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-purple-600" /> DPDP Act 2023</span>
            </div>

            {/* 4 Big Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 text-center">
              <div>
                <div className="text-2xl sm:text-4xl font-black text-[#360D1B]">₹50 Cr+</div>
                <div className="text-xs text-stone-500 mt-1 font-semibold uppercase tracking-wider">Chit Pool AUM</div>
              </div>
              <div>
                <div className="text-2xl sm:text-4xl font-black text-[#7A1F3D]">10,000+</div>
                <div className="text-xs text-stone-500 mt-1 font-semibold uppercase tracking-wider">Active Subscribers</div>
              </div>
              <div>
                <div className="text-2xl sm:text-4xl font-black text-[#C9A227]">100%</div>
                <div className="text-xs text-stone-500 mt-1 font-semibold uppercase tracking-wider">FDR Bank Escrow</div>
              </div>
              <div>
                <div className="text-2xl sm:text-4xl font-black text-emerald-700">&lt; 48h</div>
                <div className="text-xs text-stone-500 mt-1 font-semibold uppercase tracking-wider">Statutory Minutes</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. FEATURE 1: "Join 10,000+ people who already trust us"  */}
        {/* ========================================================= */}
        <section id="features" className="px-6 sm:px-12 lg:px-20 py-20 sm:py-24 border-t border-stone-200/80 bg-white">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-maroon-50 border border-maroon-200/60 text-[#7A1F3D] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                Zero Floating-Point Precision
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-[52px] font-black text-[#360D1B] tracking-tight leading-[1.12]">
                Join 10,000+ members who already trust us with their monthly savings.
              </h2>

              <p className="text-base text-stone-600 leading-relaxed font-normal">
                Join verified subscribers who choose Naveen Chit Fund for their disciplined wealth building and capital access needs. Every rupee of chit prize money is secured by 100% Fixed Deposit Receipts pledged with the Registrar of Chits before auction rooms open.
              </p>

              <div className="pt-2 flex items-center gap-4">
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs uppercase tracking-wider transition"
                >
                  <Play className="w-4 h-4 fill-emerald-800 text-emerald-800" />
                  Watch Chit Mechanics
                </a>
              </div>
            </div>

            {/* Right: Phone in Hand / Angle Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-[280px] sm:w-[310px] rounded-[44px] bg-[#160C10] p-3 shadow-2xl border-[6px] border-stone-900 transform lg:rotate-2 hover:rotate-0 transition duration-500">
                <div className="rounded-[36px] bg-[#FAF8F5] overflow-hidden text-left p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <div className="text-xs font-bold text-[#4E1327]">Explore Active Chits</div>
                      <div className="text-[10px] text-stone-400">Guaranteed State Registrations</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>

                  {/* Chit Card 1 */}
                  <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#4E1327]">Smart Wealth (Gold-20)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-100 text-gold-800 font-bold">OPEN</span>
                    </div>
                    <div className="text-lg font-black text-stone-900">₹5,00,000</div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 pt-1 border-t border-stone-100">
                      <div>Monthly: <strong className="text-stone-800">₹25,000</strong></div>
                      <div>Tenure: <strong className="text-stone-800">20 Months</strong></div>
                    </div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#7A1F3D] h-full w-[95%]"></div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-stone-400">
                      <span>19/20 Slots Enrolled</span>
                      <span className="text-[#7A1F3D] font-bold">1 Seat Left</span>
                    </div>
                  </div>

                  {/* Chit Card 2 */}
                  <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#4E1327]">Enterprise Chit (E-40)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">ACTIVE</span>
                    </div>
                    <div className="text-lg font-black text-stone-900">₹10,00,000</div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 pt-1 border-t border-stone-100">
                      <div>Monthly: <strong className="text-stone-800">₹25,000</strong></div>
                      <div>Tenure: <strong className="text-stone-800">40 Months</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. FEATURE 2: Horizontal Card Display ("Simplify wallet") */}
        {/* ========================================================= */}
        <section className="px-6 sm:px-12 lg:px-20 py-20 sm:py-24 border-t border-stone-200/80 bg-[#FAF8F5]">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Landscape Phone / Ticket Deck Mockup */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-[420px] rounded-[32px] bg-white p-6 shadow-xl border border-stone-200/90 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#7A1F3D]" />
                    <span className="text-xs font-bold text-stone-800">My Subscribed Chit Tickets</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#C9A227] bg-amber-50 px-2.5 py-0.5 rounded-full">
                    2 Active Pools
                  </span>
                </div>

                {/* Ticket Card 1 */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#4E1327] to-[#7A1F3D] text-white shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-gold-300 font-semibold uppercase">Ticket #07</span>
                      <h4 className="text-sm font-bold text-white">Smart Wealth Chit (Gold-20)</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/20 text-white">
                      Non-Prized
                    </span>
                  </div>
                  <div className="flex justify-between items-end text-xs">
                    <div>
                      <span className="text-[9px] text-white/70 block">Gross Pool Value</span>
                      <span className="text-base font-black text-white">₹5,00,000</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-white/70 block">Next Auction</span>
                      <span className="font-bold text-gold-300">2d : 14h : 22m</span>
                    </div>
                  </div>
                </div>

                {/* Installment Breakdown Card */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Base Monthly Installment:</span>
                    <span className="font-semibold text-stone-900">₹25,000</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Auction Dividend Credited:</span>
                    <span>- ₹4,875</span>
                  </div>
                  <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
                    <span className="font-bold text-[#360D1B]">Net Amount Payable:</span>
                    <span className="text-base font-black text-[#7A1F3D]">₹20,125</span>
                  </div>
                </div>

                {/* Razorpay Badge */}
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Razorpay Webhook Verified</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold">UTR: CMS998231</span>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <h2 className="text-3xl sm:text-5xl lg:text-[48px] font-black text-[#360D1B] tracking-tight leading-[1.12]">
                Simplify your wallet, manage your tickets effortlessly.
              </h2>

              <p className="text-base text-stone-600 leading-relaxed font-normal">
                Naveen Chit Fund allows you to manage all of your enrolled chit tickets in one transparent place. Track auction schedules, view real-time dividend offsets credited directly against your upcoming installments, and complete payments via Razorpay UPI or NetBanking.
              </p>

              <div className="space-y-3 pt-2 text-xs font-semibold text-stone-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</div>
                  <span>Instant dividend offsets credited before next month's due date</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</div>
                  <span>Zero floating-point rounding drift with integer-paise financial precision</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</div>
                  <span>Automated PDF payment receipts and Form XIV registrar audit minutes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. BOTTOM CLIMAX SHOWCASE: "Keeping Finance In One App"    */}
        {/* ========================================================= */}
        <section id="app-showcase" className="px-6 sm:px-10 lg:px-16 pt-20 pb-28 bg-[#1F0E17] text-white relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-radial from-maroon-700/20 to-transparent pointer-events-none"></div>

          <div className="max-w-6xl mx-auto text-center relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-5xl lg:text-[68px] font-black tracking-tight text-[#FAF3E7] leading-tight">
              Keeping Your <br className="hidden sm:inline" />
              Chit Funds In <br className="hidden sm:inline" />
              One App
            </h2>
            <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto font-light">
              Experience the complete subscriber lifecycle: from discovery and live reverse auctions
              to instant dividend accounting and prized disbursals.
            </p>
          </div>

          {/* 5 Real Mobile Phone App Screens Parade */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-4 max-w-7xl mx-auto items-end">
            
            {/* Screen 1: Splash / Welcome Screen */}
            <div className="rounded-[36px] bg-[#160C10] p-2.5 shadow-2xl border-[4px] border-stone-800">
              <div className="rounded-[28px] bg-gradient-to-b from-[#4E1327] via-[#5B132B] to-[#160C10] p-4 text-white text-center h-[420px] flex flex-col justify-between">
                <div className="w-12 h-3 bg-black rounded-full mx-auto -mt-2 mb-4"></div>
                <div className="my-auto space-y-3">
                  <img src="/logo.png" alt="Logo" className="w-14 h-14 mx-auto rounded-2xl shadow-lg border border-gold-400/40" />
                  <h3 className="text-base font-extrabold text-white">Naveen Chit</h3>
                  <p className="text-[10px] text-gold-300 font-semibold">Govt. Regulated ROSCA</p>
                  <p className="text-[9px] text-stone-300 px-2 leading-relaxed">
                    100% Fixed Deposit Receipts Pledged With State Registrar
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-full py-2 rounded-xl bg-gold-500 text-navy-950 font-bold text-[10px]">
                    Verify via Phone OTP
                  </div>
                  <span className="text-[8px] text-stone-400 block">Chit Funds Act 1982 Registered</span>
                </div>
              </div>
              <div className="text-center mt-2 text-[11px] font-bold text-gold-300">1. Onboarding & KYC</div>
            </div>

            {/* Screen 2: Explore Chits / Home */}
            <div className="rounded-[36px] bg-[#160C10] p-2.5 shadow-2xl border-[4px] border-stone-800">
              <div className="rounded-[28px] bg-[#FFFDF9] p-3 text-slate-900 text-left h-[420px] flex flex-col justify-between overflow-hidden">
                <div className="w-12 h-3 bg-black rounded-full mx-auto -mt-1 mb-2"></div>
                
                {/* Header */}
                <div className="border-b border-stone-100 pb-2">
                  <div className="text-[9px] text-stone-400">Total Chit Pool</div>
                  <div className="text-base font-black text-[#4E1327]">₹4,75,250</div>
                </div>

                {/* Card */}
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <span className="text-[9px] font-bold text-[#7A1F3D]">Smart Wealth (Gold-20)</span>
                  <div className="text-xs font-black text-stone-900">₹5,00,000</div>
                  <div className="text-[8px] text-stone-500">₹25,000 / month • 20 Mo</div>
                  <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-[#7A1F3D] h-full w-[95%]"></div>
                  </div>
                  <div className="text-[8px] text-emerald-700 font-bold">19/20 Slots Enrolled</div>
                </div>

                {/* Card 2 */}
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                  <span className="text-[9px] font-bold text-[#7A1F3D]">Silver Saver (S-25)</span>
                  <div className="text-xs font-black text-stone-900">₹2,50,000</div>
                  <div className="text-[8px] text-stone-500">₹10,000 / month • 25 Mo</div>
                </div>

                <div className="py-1.5 rounded-xl bg-[#4E1327] text-white text-center font-bold text-[9px]">
                  Join Chit Pool
                </div>
              </div>
              <div className="text-center mt-2 text-[11px] font-bold text-gold-300">2. Explore & Enroll</div>
            </div>

            {/* Screen 3: Live Reverse Auction Room */}
            <div className="rounded-[36px] bg-[#160C10] p-2.5 shadow-2xl border-[4px] border-gold-500/80 ring-2 ring-gold-400/30">
              <div className="rounded-[28px] bg-[#1F0E17] p-3 text-white text-left h-[420px] flex flex-col justify-between">
                <div className="w-12 h-3 bg-black rounded-full mx-auto -mt-1 mb-2"></div>
                
                <div className="text-center border-b border-white/10 pb-2">
                  <span className="text-[9px] text-gold-400 font-bold uppercase">Live Reverse Auction</span>
                  <div className="text-xs font-bold text-white">Month #04 • Gold-20</div>
                  <div className="text-xs font-black text-rose-400 animate-pulse mt-0.5">⏱ 01:24 left</div>
                </div>

                {/* Circular Dial Representation */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                  <div className="text-[9px] text-stone-400">Leading Discount Bid</div>
                  <div className="text-2xl font-black text-gold-400">24.5%</div>
                  <div className="text-[9px] text-emerald-400 font-bold">Prize Money: ₹3,75,000</div>
                </div>

                {/* Bid Ticker */}
                <div className="space-y-1 text-[8px]">
                  <div className="p-1 rounded bg-white/10 flex justify-between">
                    <span>Ticket #12</span>
                    <span className="font-bold text-gold-300">24.5% (Leading)</span>
                  </div>
                  <div className="p-1 rounded bg-white/5 flex justify-between text-stone-400">
                    <span>Ticket #03</span>
                    <span>24.0%</span>
                  </div>
                </div>

                <div className="py-2 rounded-xl bg-gold-500 text-navy-950 text-center font-bold text-[9px] shadow-sm">
                  Place Lower Bid (24.6% - 40%)
                </div>
              </div>
              <div className="text-center mt-2 text-[11px] font-bold text-gold-400">3. Live Auction Room</div>
            </div>

            {/* Screen 4: Installment & Payments */}
            <div className="rounded-[36px] bg-[#160C10] p-2.5 shadow-2xl border-[4px] border-stone-800">
              <div className="rounded-[28px] bg-[#FFFDF9] p-3 text-slate-900 text-left h-[420px] flex flex-col justify-between">
                <div className="w-12 h-3 bg-black rounded-full mx-auto -mt-1 mb-2"></div>
                
                <div className="border-b border-stone-100 pb-2">
                  <div className="text-[9px] text-stone-400">Installment Dues</div>
                  <div className="text-xs font-bold text-[#4E1327]">Month #04 Schedule</div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[9px] space-y-1">
                  <div className="flex justify-between">
                    <span>Base Installment:</span>
                    <span>₹25,000</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Dividend Offset:</span>
                    <span>- ₹4,875</span>
                  </div>
                  <div className="pt-1 border-t border-stone-200 flex justify-between font-black text-[#4E1327] text-[10px]">
                    <span>Net Due:</span>
                    <span>₹20,125</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[8px] text-emerald-900 space-y-0.5">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Paid via Razorpay</span>
                  </div>
                  <div>Receipt: REC-2026-092</div>
                </div>

                <div className="py-1.5 rounded-xl bg-[#7A1F3D] text-white text-center font-bold text-[9px]">
                  Download Receipt (PDF)
                </div>
              </div>
              <div className="text-center mt-2 text-[11px] font-bold text-gold-300">4. Dividend Accounting</div>
            </div>

            {/* Screen 5: Prized Winner & Surety Verification */}
            <div className="rounded-[36px] bg-[#160C10] p-2.5 shadow-2xl border-[4px] border-stone-800">
              <div className="rounded-[28px] bg-[#FFFDF9] p-3 text-slate-900 text-left h-[420px] flex flex-col justify-between">
                <div className="w-12 h-3 bg-black rounded-full mx-auto -mt-1 mb-2"></div>
                
                <div className="border-b border-stone-100 pb-2">
                  <div className="text-[9px] text-gold-600 font-bold uppercase">Prize Disbursal</div>
                  <div className="text-xs font-bold text-stone-900">Surety Package Review</div>
                </div>

                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-[9px] text-stone-500">Prize Winner (SB)</div>
                  <div className="text-sm font-black text-emerald-700">₹3,75,000</div>
                  <div className="text-[8px] text-emerald-800">Winning Bid: 24.5%</div>
                </div>

                <div className="space-y-1 text-[8px] text-stone-600">
                  <div className="p-1 rounded bg-stone-100 flex justify-between">
                    <span>Guarantor 1: A. Kumar</span>
                    <span className="text-emerald-700 font-bold">CIBIL 780 ✓</span>
                  </div>
                  <div className="p-1 rounded bg-stone-100 flex justify-between">
                    <span>Guarantor 2: R. Verma</span>
                    <span className="text-emerald-700 font-bold">Verified ✓</span>
                  </div>
                </div>

                <div className="py-1.5 rounded-xl bg-emerald-700 text-white text-center font-bold text-[9px]">
                  RTGS UTR Generated
                </div>
              </div>
              <div className="text-center mt-2 text-[11px] font-bold text-gold-300">5. Prized Disbursal</div>
            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. INTERACTIVE CHIT CALCULATOR                            */}
        {/* ========================================================= */}
        <section id="calculator" className="px-6 sm:px-12 lg:px-20 py-20 bg-white border-t border-stone-200/80">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-[#7A1F3D] uppercase tracking-wider">
                Financial Transparency
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#360D1B]">
                Interactive Chit Yield & Dividend Calculator
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 max-w-xl mx-auto">
                Calculate your exact monthly installments, distributable dividends, and net prize payouts based on statutory regulations.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-[28px] bg-stone-50 border border-stone-200/90 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Sliders */}
              <div className="space-y-6 text-xs font-bold text-stone-700">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span>Gross Chit Pool Value</span>
                    <span className="text-sm font-extrabold text-[#7A1F3D]">
                      ₹{calcChitAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="1000000"
                    step="50000"
                    value={calcChitAmount}
                    onChange={(e) => setCalcChitAmount(Number(e.target.value))}
                    className="w-full accent-[#7A1F3D] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>₹1,00,000</span>
                    <span>₹10,00,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <span>Tenure & Subscribers</span>
                    <span className="text-sm font-extrabold text-[#7A1F3D]">
                      {calcTenure} Months / Members
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[20, 25, 40, 50].map((t) => (
                      <button
                        key={t}
                        onClick={() => setCalcTenure(t)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                          calcTenure === t
                            ? 'bg-[#7A1F3D] text-white shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {t}M
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <span>Winning Bid Discount Percentage</span>
                    <span className="text-sm font-extrabold text-[#C9A227]">
                      {calcDiscountPct}% (Floor: 5%, Cap: 40%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="0.5"
                    value={calcDiscountPct}
                    onChange={(e) => setCalcDiscountPct(Number(e.target.value))}
                    className="w-full accent-[#C9A227] cursor-pointer"
                  />
                </div>
              </div>

              {/* Real-time Math Output Card */}
              <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-md space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">Net Prize Money (Winner Takes Home)</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                    ₹{netPrizeMoney.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Base Monthly Contribution:</span>
                    <span className="font-bold text-stone-900">₹{monthlyInstallment.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Foreman Commission (5%):</span>
                    <span className="font-bold text-stone-900">₹{foremanCommission.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Distributable Dividend per Member:</span>
                    <span>- ₹{dividendPerMember.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-black text-[#4E1327]">
                    <span>Net Installment Payable:</span>
                    <span>₹{netInstallmentDue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. FAQ ACCORDION                                          */}
        {/* ========================================================= */}
        <section id="faqs" className="px-6 sm:px-12 lg:px-20 py-20 bg-[#FAF8F5] border-t border-stone-200/80">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-[#7A1F3D] uppercase tracking-wider">
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#360D1B]">
                Everything You Need To Know
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-stone-200/80 shadow-xs overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-stone-900 hover:text-[#7A1F3D] transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#C9A227] transition-transform duration-200 ${
                        openFaq === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="p-5 pt-0 text-xs sm:text-sm text-stone-600 border-t border-stone-100 leading-relaxed font-normal">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 9. STATUTORY FOOTER                                       */}
        {/* ========================================================= */}
        <footer className="mt-auto border-t border-stone-200/80 bg-white py-12 px-6 sm:px-12 lg:px-16 text-xs text-stone-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Naveen Chit Logo" className="w-8 h-8 rounded-lg object-contain shadow-xs" />
              <div>
                <span className="font-extrabold text-[#4E1327] block text-sm">Naveen Chit Fund Private Limited</span>
                <span className="text-[10px] text-stone-400">Govt. Regulated Digital ROSCA Platform</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-stone-500 text-[11px]">
              <span>CIN: U65992TS2024PTC180123</span>
              <span>GSTIN: 36AAACC1206K1ZF</span>
              <span>ROC Hyderabad (Telangana)</span>
              <span>Chit Funds Act 1982 Compliant</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/chit"
                className="text-xs font-bold text-[#7A1F3D] hover:underline"
              >
                Superadmin Portal &rarr;
              </Link>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-stone-100 text-center text-stone-400 text-[10px]">
            &copy; {new Date().getFullYear()} Naveen Chit Fund Private Limited. All statutory rights reserved. Operated strictly under Central and State Chit Fund Rules.
          </div>
        </footer>

      </div>
    </div>
  );
};
