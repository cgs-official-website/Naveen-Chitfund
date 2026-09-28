import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { KeyRound, Shield, Moon, Sun, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
export const SettingsPage = () => {
    const { admin, clearMustChangePassword } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();
    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
        onSuccess: () => {
            setPwdSuccess('Password changed successfully. Your temporary credentials have been cleared.');
            setPwdError('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            clearMustChangePassword();
        },
        onError: (err) => {
            setPwdError(err.response?.data?.error || 'Failed to update password');
            setPwdSuccess('');
        },
    });
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setPwdError('');
        setPwdSuccess('');
        if (newPassword.length < 12) {
            setPwdError('New password must be at least 12 characters in length for institutional security.');
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
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Superadmin Governance Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage root administrative security credentials, UI theme preferences, and statutory parameters.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gold-500"/> Administrative Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
            <span className="text-slate-400 block font-semibold">Account Email</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{admin?.email}</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg">
            <span className="text-slate-400 block font-semibold">Authorized Role</span>
            <span className="font-bold text-gold-500 text-sm">{admin?.role || 'SUPERADMIN'}</span>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="p-6 bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-gold-500"/> Security Credential Rotation
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Enforces a minimum 12-character high-entropy password to protect the superadmin control deck.
          </p>
        </div>

        {pwdSuccess && (<div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs rounded-input flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500"/>
            <span>{pwdSuccess}</span>
          </div>)}

        {pwdError && (<div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs rounded-input flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500"/>
            <span>{pwdError}</span>
          </div>)}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-stone-900 dark:text-stone-100"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password (minimum 12 characters)
            </label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-stone-900 dark:text-stone-100"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-stone-900 dark:text-stone-100"/>
          </div>

          <button type="submit" disabled={changePasswordMutation.isPending} className="px-5 py-2.5 rounded-input bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs shadow-sm transition disabled:opacity-50">
            {changePasswordMutation.isPending ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Theme Preference */}
      <div className="p-6 bg-white dark:bg-[#1A0C14] border border-stone-200/90 dark:border-maroon-900/50 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Interface Theme</h3>
          <p className="text-xs text-slate-500 mt-0.5">Toggle between dark and light appearance.</p>
        </div>
        <button onClick={toggleTheme} className="px-4 py-2 rounded-input border border-slate-200 dark:border-navy-700 flex items-center gap-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-navy-800 transition">
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

