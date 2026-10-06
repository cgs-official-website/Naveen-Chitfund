import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  ShieldAlert,
  User,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useAdminNotifications } from './useAdminNotifications';

export const Topbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    totalUnreadCount,
    browserPermission,
    requestBrowserPermission,
    hasBrowserSupport,
    dismissNotification,
    dismissAll,
  } = useAdminNotifications();

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/chit');
  };

  const handleNotificationClick = (item) => {
    dismissNotification(item.id);
    if (item.path) {
      dismissNotification(item.path);
      navigate(item.path);
    }
    setShowNotifications(false);
  };

  return (
    <header className="sticky top-3 z-40 px-3 sm:px-5 md:px-6 lg:px-7 transition-all">
      <div className="flex flex-col bg-white/95 dark:bg-[#150A12]/95 backdrop-blur-2xl border border-stone-200/90 dark:border-maroon-800/60 shadow-lg shadow-black/5 dark:shadow-maroon-950/40 rounded-2xl overflow-visible transition-colors">
        {/* Top Banner if must change password */}
        {admin?.mustChangePassword && (
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-maroon-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs rounded-t-2xl">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Security notice: You are using temporary credentials. Please update your master password immediately.
              </span>
            </div>
            <Link
              to="/chit/settings"
              className="underline hover:text-white transition font-black shrink-0 ml-2"
            >
              Change Password &rarr;
            </Link>
          </div>
        )}

        {/* Main Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 h-16 sm:h-18 gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
            {/* Hamburger button for mobile drawer and desktop sidebar toggle */}
            <button
              onClick={onToggleSidebar}
              className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-gold-300 rounded-full hover:bg-stone-100 dark:hover:bg-maroon-950/60 transition cursor-pointer"
              aria-label="Toggle navigation drawer"
              title="Toggle navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Reference UI Rounded Search Pill Bar */}
            <div className="relative flex-1 max-w-md hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 dark:text-stone-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search chits, foremen, tickets, logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full text-xs font-medium bg-stone-100/90 dark:bg-[#1A0B16] border border-stone-200/80 dark:border-maroon-900/50 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Right tools - Circular Pill Action Buttons matching reference */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Notification Bell Button & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                className={`w-10 h-10 rounded-full border border-stone-200/90 dark:border-maroon-800/60 bg-stone-100/80 dark:bg-[#1A0B16] text-slate-700 dark:text-stone-300 flex items-center justify-center shadow-xs cursor-pointer hover:bg-stone-200/70 dark:hover:bg-maroon-900/50 transition relative ${
                  showNotifications ? 'ring-2 ring-gold-400 bg-stone-200/80 dark:bg-maroon-900/60' : ''
                }`}
                title="Notifications"
                aria-label="Open notifications"
              >
                <Bell className="w-4 h-4" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse ring-2 ring-white dark:ring-[#11060D]">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown Panel - Responsive for mobile and desktop */}
              {showNotifications && (
                <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-20 sm:top-full sm:mt-3 max-w-[calc(100vw-24px)] sm:w-96 bg-white dark:bg-[#150711] border border-stone-200 dark:border-gold-500/30 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Dropdown Header */}
                  <div className="px-5 py-4 bg-gradient-to-r from-stone-50 to-stone-100 dark:from-[#1E0918] dark:to-[#170512] border-b border-stone-200/80 dark:border-maroon-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">
                        Surveillance & Alerts
                      </span>
                      {totalUnreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                          {totalUnreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      {totalUnreadCount > 0 && (
                        <button
                          onClick={dismissAll}
                          className="text-[11px] font-bold text-gold-600 dark:text-gold-400 hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="sm:hidden p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/50 dark:hover:bg-maroon-900/40 transition cursor-pointer"
                        aria-label="Close notifications"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Browser Desktop Notification Prompt Banner */}
                  {hasBrowserSupport && browserPermission === 'default' && (
                    <div className="px-4 py-2.5 bg-gold-500/10 dark:bg-gold-500/15 border-b border-gold-500/20 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bell className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
                        <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300 truncate">
                          Get real-time desktop alerts
                        </span>
                      </div>
                      <button
                        onClick={requestBrowserPermission}
                        className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-gold-500 hover:bg-gold-600 text-maroon-950 shadow-xs transition cursor-pointer shrink-0"
                      >
                        Enable
                      </button>
                    </div>
                  )}

                  {/* Notification List Items */}
                  <div className="max-h-[70vh] sm:max-h-[380px] overflow-y-auto divide-y divide-stone-100 dark:divide-maroon-900/30">
                    {notifications.length === 0 ? (
                      <div className="py-10 px-4 text-center">
                        <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-500/60 mb-2" />
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          All caught up!
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          No pending alerts or operational actions required.
                        </p>
                      </div>
                    ) : (
                      notifications.map((item) => {
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className="p-4 hover:bg-stone-50 dark:hover:bg-maroon-950/40 transition cursor-pointer flex items-start gap-3 group"
                          >
                            {/* Type Indicator Icon */}
                            <div className="shrink-0 mt-0.5">
                              {item.type === 'success' ? (
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                  <Radio className="w-4 h-4 animate-pulse" />
                                </div>
                              ) : item.type === 'warning' ? (
                                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                  <AlertTriangle className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-gold-500/15 text-gold-600 dark:text-gold-400 flex items-center justify-center">
                                  <Clock className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            {/* Content & Module Target */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-black text-stone-900 dark:text-stone-100 group-hover:text-gold-500 transition truncate">
                                  {item.title}
                                </span>
                                <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider shrink-0">
                                  {item.time}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                              <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-gold-600 dark:text-gold-400 group-hover:translate-x-0.5 transition-transform">
                                <span>Go to {item.category || 'module'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle - Circular Luxury Icon */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-stone-200/90 dark:border-maroon-800/60 bg-stone-100/80 dark:bg-[#1A0B16] text-slate-700 dark:text-gold-400 hover:bg-stone-200/70 dark:hover:bg-maroon-900/50 transition flex items-center justify-center cursor-pointer shadow-xs"
              aria-label="Toggle dark/light theme"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4 text-[#7A1F3D]" />}
            </button>

            {/* Admin Profile & Logout */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-stone-200/80 dark:border-maroon-900/40">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {admin?.fullName || 'Super Admin'}
                </span>
                <span className="text-[10px] text-gold-600 dark:text-gold-400 font-black uppercase tracking-wider">
                  {admin?.role || 'SUPERADMIN'}
                </span>
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4E1327] via-[#7A1F3D] to-[#250A13] text-gold-300 flex items-center justify-center font-bold text-xs shadow-md border border-gold-400/40">
                <User className="w-4 h-4" />
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full hover:bg-stone-100 dark:hover:bg-maroon-950/60 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

