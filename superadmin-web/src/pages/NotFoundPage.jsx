import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';
export const NotFoundPage = () => {
    return (<div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gold-500/20 text-gold-400 flex items-center justify-center mb-6 border border-gold-500/30">
        <Shield className="w-8 h-8"/>
      </div>
      <h1 className="text-4xl font-extrabold text-white">404</h1>
      <p className="text-base text-slate-400 mt-2 max-w-sm">
        The requested administrative route or page does not exist.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link to="/" className="px-5 py-2.5 rounded-input bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold">
          Public Landing
        </Link>
        <Link to="/chit/dashboard" className="px-5 py-2.5 rounded-input bg-gold-500 hover:bg-gold-400 text-navy-950 text-xs font-bold shadow-sm flex items-center gap-1.5">
          <Home className="w-4 h-4"/> Superadmin Dashboard
        </Link>
      </div>
    </div>);
};

