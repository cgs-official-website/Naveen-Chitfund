import React, { useState } from 'react';
import { Menu, Moon, Sun, LogOut, ShieldAlert, User, Search, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export const Topbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/chit');
  };

  return (
    <header className="sticky top-3 z-40 px-3 sm:px-5 md:px-6 lg:px-7 transition-all">
      <div className="flex flex-col bg-white/95 dark:bg-[#150A12]/95 backdrop-blur-2xl border border-stone-200/90 dark:border-maroon-800/60 shadow-lg shadow-black/5 dark:shadow-maroon-950/40 rounded-2xl overflow-hidden transition-colors">
        {/* Top Banner if must change password */}
        {admin?.mustChangePassword && (
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-maroon-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs">
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
          {/* Notification Button */}
          <div className="w-10 h-10 rounded-full border border-stone-200/90 dark:border-maroon-800/60 bg-stone-100/80 dark:bg-[#1A0B16] text-slate-700 dark:text-stone-300 flex items-center justify-center shadow-xs cursor-pointer hover:bg-stone-200/70 dark:hover:bg-maroon-900/50 transition relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold-400 ring-2 ring-white dark:ring-[#11060D]" />
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
