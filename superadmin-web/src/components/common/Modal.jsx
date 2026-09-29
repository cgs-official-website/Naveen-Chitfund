import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = 'lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0E0409]/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidthClass} bg-white dark:bg-[#160B12] border border-stone-200/90 dark:border-maroon-800/60 shadow-2xl shadow-black/50 z-10 flex flex-col max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden`}
      >
        {/* Luxury top accent stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-maroon-700 via-gold-500 to-amber-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-stone-100/90 dark:border-maroon-900/50 bg-stone-50/50 dark:bg-[#1A0C16]/50">
          <h3 className="text-sm sm:text-base font-black text-stone-900 dark:text-stone-100 tracking-tight truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-gold-300 hover:bg-stone-100 dark:hover:bg-maroon-950/70 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 bg-stone-50/80 dark:bg-[#12070E] border-t border-stone-100/90 dark:border-maroon-900/50 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
