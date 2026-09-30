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
import { useAdminNotifications } from './useAdminNotifications';

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
  const { countsByPath, dismissByPath } = useAdminNotifications();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileActive && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar Container - Reference Curved Dock Style */}
      <aside
        className={`fixed z-50 flex flex-col bg-[#140810]/95 dark:bg-[#12060E]/95 text-slate-300 border border-gold-500/20 shadow-2xl transition-all duration-300 ease-in-out backdrop-blur-2xl overflow-hidden ${
          mobileActive
            ? 'top-3 bottom-3 left-3 translate-x-0 w-64 rounded-[30px]'
            : '-translate-x-[150%] pointer-events-none lg:pointer-events-auto lg:top-3 lg:bottom-3 lg:left-3 lg:translate-x-0 lg:rounded-[30px]'
        } ${isDesktopOpen ? 'lg:w-64' : 'lg:w-20'}`}
      >
        {/* Brand Header & Top Collapse Control */}
        <div className={`flex items-center ${isDesktopOpen ? 'justify-between px-3.5' : 'justify-center px-0'} h-20 bg-gradient-to-b from-[#1C0A16]/80 to-transparent`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-[#1C0A16] border border-gold-400/40 flex items-center justify-center overflow-hidden shadow-md">
                <img
                  src="/logo.png"
                  alt="Naveen Chit Logo"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#12060E] rounded-full shadow-xs" />
            </div>
            {(isDesktopOpen || mobileActive) && (
              <div className="whitespace-nowrap transition-opacity duration-200">
                <span className="font-black text-white text-[15px] tracking-wide block bg-gradient-to-r from-white via-stone-100 to-gold-200 bg-clip-text text-transparent">
                  NAVEEN CHIT
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Top Collapse Toggle Button - Only shown when sidebar is open */}
            {isDesktopOpen && (
              <button
                onClick={onToggleDesktop}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-gold-300 hover:bg-white/10 transition cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
              </button>
            )}

            {/* Close button for mobile drawer */}
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-maroon-900/40 lg:hidden transition cursor-pointer"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const showLabel = isDesktopOpen || mobileActive;
            const badgeCount = countsByPath[item.path] || 0;

            const handleClick = () => {
              if (badgeCount > 0) {
                dismissByPath(item.path);
              }
              if (handleClose) handleClose();
            };

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleClick}
                title={!isDesktopOpen ? `${item.label} ${badgeCount > 0 ? `(${badgeCount})` : ''}` : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center ${
                    showLabel ? 'justify-between px-3.5' : 'justify-center px-0'
                  } py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all duration-200 min-h-[44px] ${
                    isActive
                      ? 'bg-gradient-to-r from-gold-500 via-gold-400 to-amber-500 text-[#140810] font-black shadow-lg shadow-gold-500/25 ring-1 ring-gold-300'
                      : 'text-stone-300/80 hover:bg-white/5 hover:text-gold-300 active:scale-[0.98]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className={`relative w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                          isDesktopOpen || mobileActive ? '' : 'w-10 h-10 rounded-2xl'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                        {/* Compact indicator dot when sidebar is collapsed */}
                        {!showLabel && badgeCount > 0 && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#140810] animate-pulse" />
                        )}
                      </div>
                      {showLabel && (
                        <span className="whitespace-nowrap">{item.label}</span>
                      )}
                    </div>

                    {/* Numeric counter badge in sidebar - disappears on click */}
                    {showLabel && badgeCount > 0 && (
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 min-w-[20px] text-[10px] font-black rounded-full transition-all shadow-xs ${
                          isActive
                            ? 'bg-[#140810] text-gold-300 ring-1 ring-[#140810]'
                            : 'bg-rose-500 text-white shadow-rose-500/40 animate-pulse'
                        }`}
                      >
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
