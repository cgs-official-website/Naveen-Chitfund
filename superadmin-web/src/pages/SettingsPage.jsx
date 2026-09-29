import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { KeyRound, Shield, Moon, Sun, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
export const SettingsPage = () => {
    const { admin, login, clearMustChangePassword } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();
    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [pwdSuccess, setPwdSuccess] = useState('');
    const [pwdError, setPwdError] = useState('');
    // Platform settings fetch
    const { data: platformSettings, isLoading } = useQuery({
        queryKey: ['superadmin-platform-settings'],
        queryFn: async () => {
            const res = await api.get('/api/v1/superadmin/settings');
            return res.data.data;
        },
    });
    // Password change mutation
    const changePasswordMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/api/v1/superadmin/auth/change-password', payload);
            return res.data;
        },
        onSuccess: (data) => {
            setPwdSuccess('Password changed successfully. Your credentials and session have been securely updated.');
            setPwdError('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            if (data?.data?.accessToken && data?.data?.refreshToken && data?.data?.admin) {
                login(data.data.accessToken, data.data.refreshToken, data.data.admin);
            } else {
                clearMustChangePassword();
            }
        },
        onError: (err) => {
            const errorMsg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                err.message ||
                'Failed to update password. Please check your current password.';
            setPwdError(errorMsg);
            setPwdSuccess('');
        },
    });
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setPwdError('');
        setPwdSuccess('');
        if (newPassword.length < 8) {
            setPwdError('New password must be at least 8 characters in length.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwdError('New password and confirmation password do not match.');
            return;
        }
        changePasswordMutation.mutate({
            currentPassword,
            newPassword,
        });
    };
    return (<div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
            Superadmin Governance Settings
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Manage root administrative security credentials, UI theme preferences, and statutory parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold-500/10 text-gold-600 dark:text-gold-300 border border-gold-500/30">
            Fiduciary Access Level
          </span>
        </div>
      </div>

      {/* Profile Card */}
      <div className="p-6 bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm space-y-4 backdrop-blur-md">
        <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 uppercase tracking-wider text-xs">
          <Shield className="w-4 h-4 text-gold-500"/> Administrative Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-stone-50/80 dark:bg-[#1C0D17]/80 border border-stone-200/60 dark:border-maroon-900/40 rounded-xl">
            <span className="text-stone-400 block font-bold text-[10px] uppercase tracking-wider mb-1">Account Email</span>
            <span className="font-black text-stone-900 dark:text-stone-100 text-sm">{admin?.email}</span>
          </div>
          <div className="p-4 bg-stone-50/80 dark:bg-[#1C0D17]/80 border border-stone-200/60 dark:border-maroon-900/40 rounded-xl">
            <span className="text-stone-400 block font-bold text-[10px] uppercase tracking-wider mb-1">Authorized Role</span>
            <span className="font-black text-gold-500 text-sm">{admin?.role || 'SUPERADMIN'}</span>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="p-6 bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm space-y-5 backdrop-blur-md">
        <div>
          <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 uppercase tracking-wider text-xs">
            <KeyRound className="w-4 h-4 text-gold-500"/> Security Credential Rotation
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Enforces a minimum 12-character high-entropy password to protect the superadmin control deck.
          </p>
        </div>

        {pwdSuccess && (<div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500"/>
            <span>{pwdSuccess}</span>
          </div>)}

        {pwdError && (<div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500"/>
            <span>{pwdError}</span>
          </div>)}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Current Master Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full p-2.5 pr-10 text-sm bg-stone-50 dark:bg-[#1C0D18] border border-stone-200 dark:border-maroon-800/60 rounded-xl text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              New Password (minimum 8 characters)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 chars)"
                className="w-full p-2.5 pr-10 text-sm bg-stone-50 dark:bg-[#1C0D18] border border-stone-200 dark:border-maroon-800/60 rounded-xl text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Confirm New Password
            </label>
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full p-2.5 text-sm bg-stone-50 dark:bg-[#1C0D18] border border-stone-200 dark:border-maroon-800/60 rounded-xl text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
            />
          </div>

          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-[#160812] font-black text-xs shadow-md shadow-gold-500/25 transition disabled:opacity-50 cursor-pointer"
          >
            {changePasswordMutation.isPending ? 'Updating Password...' : 'Update Master Password'}
          </button>
        </form>
      </div>

      {/* Theme Preference */}
      <div className="p-6 bg-white/95 dark:bg-[#150A11]/95 border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm flex items-center justify-between backdrop-blur-md">
        <div>
          <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">Interface Theme</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Toggle between dark and light appearance.</p>
        </div>
        <button onClick={toggleTheme} className="px-4 py-2 rounded-xl border border-stone-200 dark:border-maroon-800/60 flex items-center gap-2 text-xs font-bold hover:bg-stone-50 dark:hover:bg-maroon-950/60 transition cursor-pointer">
          {isDark ? <Sun className="w-4 h-4 text-gold-400"/> : <Moon className="w-4 h-4 text-slate-600"/>}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Platform Statutory Limits View */}
      <div className="p-6 bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Statutory Platform Parameters</h3>
          <p className="text-xs text-slate-500 mt-0.5">Fixed statutory limits mandated by Central and State Chit Fund Acts.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
            <span className="text-slate-400 block font-semibold">Maximum Bid Discount</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {platformSettings?.statutoryMaxDiscountPct || 40}% (Section 14 Cap)
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
            <span className="text-slate-400 block font-semibold">Foreman Commission</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {platformSettings?.foremanCommissionPct || 5}% (Section 21 Cap)
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
            <span className="text-slate-400 block font-semibold">Bank FDR Escrow Pledge</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {platformSettings?.fdrPledgeRequiredPct || 100}% of Chit Value
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
            <span className="text-slate-400 block font-semibold">GST Commission Rate</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {platformSettings?.gstRatePct || 18}% (Notif. 11/2017)
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
            <span className="text-slate-400 block font-semibold">Form XIV Filing Window</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {platformSettings?.formXivFilingWindowHours || 48} Hours Post-Auction
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
            <span className="text-slate-400 block font-semibold">Session Auto-Lockout</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              5 Failed Attempts / 15m Lock
            </span>
          </div>
        </div>
      </div>
    </div>);
};

