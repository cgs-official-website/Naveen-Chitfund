import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Layers,
  Users,
  UserCheck,
  Gavel,
  CreditCard,
  ShieldCheck,
  BookOpen,
  FileText,
  History,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { path: '/chit/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chit/foremen', label: 'Foremen', icon: Building2 },
  { path: '/chit/groups', label: 'Chit Groups', icon: Layers },
  { path: '/chit/subscribers', label: 'Subscribers', icon: Users },
  { path: '/chit/kyc', label: 'KYC Queue', icon: UserCheck },
  { path: '/chit/auctions', label: 'Live Auctions', icon: Gavel },
  { path: '/chit/payments', label: 'Payments', icon: CreditCard },
  { path: '/chit/sureties', label: 'Sureties & Payouts', icon: ShieldCheck },
  { path: '/chit/ledger', label: 'Double Ledger', icon: BookOpen },
  { path: '/chit/compliance', label: 'Compliance & GST', icon: FileText },
  { path: '/chit/audit', label: 'Audit Logs', icon: History },
  { path: '/chit/settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({
  isMobileOpen = false,
  onCloseMobile,
  isDesktopOpen = true,
  onToggleDesktop,
  isOpen,
  onClose,
}) => {
  const mobileActive = isOpen !== undefined ? isOpen : isMobileOpen;
  const handleClose = onClose || onCloseMobile;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileActive && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#14080F] text-slate-300 border-r border-[#291220] transition-all duration-300 ease-in-out ${
          mobileActive
            ? 'translate-x-0 w-64'
            : '-translate-x-full lg:translate-x-0'
        } ${isDesktopOpen ? 'lg:w-64' : 'lg:w-20'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#291220]">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/logo.png"
              alt="Naveen Chit Logo"
              className="w-9 h-9 rounded-xl object-contain shrink-0 border border-gold-400/30 shadow-xs"
            />
            {(isDesktopOpen || mobileActive) && (
              <div className="whitespace-nowrap transition-opacity duration-200">
                <span className="font-extrabold text-white text-[15px] tracking-wide block">
                  NAVEEN CHIT
                </span>
                <span className="block text-[9px] text-gold-400 font-bold tracking-widest uppercase">
                  Govt Regulated ROSCA
                </span>
              </div>
            )}
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const showLabel = isDesktopOpen || mobileActive;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => handleClose && handleClose()}
                title={!isDesktopOpen ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${
                    showLabel ? 'justify-start gap-3.5 px-3.5' : 'justify-center px-0'
                  } py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all min-h-[42px] ${
                    isActive
                      ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-maroon-950 font-bold shadow-md shadow-gold-500/25 ring-1 ring-gold-400/40'
                      : 'text-stone-300 hover:bg-[#25101C] hover:text-gold-300 active:bg-[#301625]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {showLabel && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop Collapse / Expand Toggle Button & Statutory Footer */}
        <div className="p-3 border-t border-navy-800/80 flex flex-col gap-2">
          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleDesktop}
            className="hidden lg:flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-gold-400 hover:bg-navy-900 transition"
            title={isDesktopOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isDesktopOpen ? (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Collapse Sidebar</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0" />
            )}
          </button>

          {(isDesktopOpen || mobileActive) && (
            <div className="px-1 text-[11px] text-slate-500">
              <p className="font-semibold text-slate-400">Section 18 Chit Funds Act</p>
              <p className="mt-0.5">Strict 40% Cap • 5% Commission</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
