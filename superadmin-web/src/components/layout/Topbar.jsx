import React from 'react';
import { Menu, Moon, Sun, LogOut, ShieldAlert, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
export const Topbar = ({ onToggleSidebar }) => {
    const navigate = useNavigate();
    const { admin, logout } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();
    const handleLogout = () => {
        logout();
        navigate('/chit');
    };
    return (<header className="sticky top-0 z-30 flex flex-col bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 shadow-xs transition-colors">
      {/* Top Banner if must change password */}
      {admin?.mustChangePassword && (<div className="bg-amber-500 text-navy-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0"/>
            <span>Security notice: You are using a temporary password. Please update it immediately.</span>
          </div>
          <Link to="/chit/settings" className="underline hover:text-white transition font-bold shrink-0 ml-2">
            Change Password &rarr;
          </Link>
        </div>)}

      {/* Main Bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-3">
          {/* Hamburger button for mobile drawer and desktop sidebar toggle */}
          <button onClick={onToggleSidebar} className="p-2 -ml-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition" aria-label="Toggle navigation drawer" title="Toggle navigation sidebar">
            <Menu className="w-6 h-6"/>
          </button>

          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Naveen Chit" className="w-8 h-8 rounded-lg object-contain hidden sm:block shadow-xs" />
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ChitTech <span className="text-gold-500">Superadmin</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Institutional Governance & Compliance Deck</p>
            </div>
          </div>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition" aria-label="Toggle dark/light theme">
            {isDark ? <Sun className="w-5 h-5 text-gold-400"/> : <Moon className="w-5 h-5 text-slate-600"/>}
          </button>

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-navy-800">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{admin?.fullName || 'Super Admin'}</span>
              <span className="text-[10px] text-gold-600 dark:text-gold-400 font-bold uppercase">{admin?.role || 'SUPERADMIN'}</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-navy-900 dark:bg-gold-500/20 text-gold-400 flex items-center justify-center font-bold text-xs border border-gold-500/40">
              <User className="w-4 h-4"/>
            </div>

            <button onClick={handleLogout} title="Logout" className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition">
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>
    </header>);
};
