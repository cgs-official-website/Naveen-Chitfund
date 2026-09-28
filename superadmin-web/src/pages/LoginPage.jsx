import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, AlertCircle, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../api/client';
export const LoginPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, login } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();
    const [email, setEmail] = useState('admin@naveenchit.com');
    const [password, setPassword] = useState('12345678');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [lockedMsg, setLockedMsg] = useState('');
    // If already authenticated, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/chit/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLockedMsg('');
        if (!email.trim() || !password) {
            setErrorMsg('Please enter both email and password.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await api.post('/api/v1/superadmin/auth/login', {
                email: email.trim(),
                password,
            });
            const { accessToken, refreshToken, admin } = response.data.data;
            login(accessToken, refreshToken, admin);
            navigate('/chit/dashboard', { replace: true });
        }
        catch (err) {
            const res = err.response;
            if (res?.status === 423) {
                setLockedMsg(res.data?.error || 'Account is locked due to too many failed attempts.');
            }
            else {
                setErrorMsg(res?.data?.error || 'Invalid email or password.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="min-h-screen bg-slate-100 dark:bg-navy-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans transition-colors">
      <div className="w-full max-w-4xl bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-slate-200 dark:border-navy-800 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Brand Panel (hidden below md) */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white relative overflow-hidden border-r border-navy-800">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Naveen Chit Logo" className="w-11 h-11 rounded-xl object-contain shadow-md" />
              <div>
                <span className="text-xl font-bold tracking-wider text-white">NAVEEN CHIT</span>
                <span className="block text-[10px] text-gold-400 font-bold uppercase tracking-widest">
                  Superadmin Portal
                </span>
              </div>
            </div>

            <div className="mt-12 space-y-4">
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Enterprise ROSCA Governance Suite
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Centralized statutory oversight for reverse auctions, double-entry ledger bookkeeping, 100% bank FDR escrow reserves, and State Registrar Form XIV filings.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-navy-950/60 border border-gold-500/20 text-xs space-y-1.5">
            <span className="font-semibold text-gold-400 block">Pre-seeded Test Credentials:</span>
            <p className="text-slate-300">Email: <code className="text-gold-200">admin@naveenchit.com</code></p>
            <p className="text-slate-300">Password: <code className="text-gold-200">12345678</code></p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center relative">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#7A1F3D] dark:text-slate-400 dark:hover:text-gold-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-gold-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition cursor-pointer"
              aria-label="Toggle dark/light theme"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

          <div className="mb-6">
            <div className="md:hidden flex items-center gap-2.5 mb-4">
              <img src="/logo.png" alt="Naveen Chit Logo" className="w-9 h-9 rounded-lg object-contain" />
              <span className="font-extrabold text-lg tracking-wide text-slate-900 dark:text-slate-100">NAVEEN CHIT</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Superadmin Login</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your authorized credentials to access the administrative dashboard.
            </p>
          </div>

          {/* Locked Notice */}
          {lockedMsg && (<div className="mb-6 p-4 rounded-input bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500"/>
              <div>
                <p className="font-bold">Account Locked</p>
                <p className="mt-0.5">{lockedMsg}</p>
              </div>
            </div>)}

          {/* Generic Error Banner */}
          {errorMsg && (<div className="mb-6 p-3.5 rounded-input bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500"/>
              <span>{errorMsg}</span>
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@naveenchit.com" className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition"/>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3 rounded-input bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-sm tracking-wide shadow-md shadow-gold-500/20 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]">
              {isLoading ? (<>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Verifying Credentials...</span>
                </>) : (<>
                  <Lock className="w-4 h-4"/>
                  <span>Authenticate & Enter</span>
                </>)}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-navy-800 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Government regulated financial system • Session strictly audited
            </span>
          </div>
        </div>
      </div>
    </div>);
};
