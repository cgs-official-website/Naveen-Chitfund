import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', requireReason = false, reasonPlaceholder = 'Enter reason...', isDestructive = false, isLoading = false, }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const handleConfirm = () => {
        if (requireReason && (!reason || reason.trim().length < 5)) {
            setError('Please provide a descriptive reason of at least 5 characters');
            return;
        }
        setError('');
        onConfirm(reason);
        setReason('');
    };
    const handleClose = () => {
        setReason('');
        setError('');
        onClose();
    };
    return (<Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="md" footer={<>
          <button type="button" onClick={handleClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-input transition">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={isLoading} className={`px-4 py-2 text-sm font-semibold rounded-input shadow-sm transition flex items-center gap-2 ${isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold'} disabled:opacity-50`}>
            {isLoading && <span className="animate-spin text-sm">⏳</span>}
            {confirmText}
          </button>
        </>}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full shrink-0 ${isDestructive
            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
            : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}`}>
            <AlertTriangle className="w-5 h-5"/>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">{message}</p>
        </div>

        {requireReason && (<div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason / Justification <span className="text-rose-500">*</span>
            </label>
            <textarea rows={3} value={reason} onChange={(e) => {
                setReason(e.target.value);
                if (error)
                    setError('');
            }} placeholder={reasonPlaceholder} className="w-full p-2.5 text-sm bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-input text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold-500/40"/>
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>)}
      </div>
    </Modal>);
};
