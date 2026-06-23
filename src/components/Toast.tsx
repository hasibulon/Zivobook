import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
  theme?: 'dark' | 'light'; // থিম সিঙ্ক করার জন্য প্রপ (ঐচ্ছিক করা হলো)
}

export default function Toast({ message, type, onClose, theme = 'dark' }: ToastProps) {
  const isDark = theme === 'dark';

  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  // ডাইনামিক স্টাইলিং ম্যাট্রিক্স
  const baseClass = "fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl max-w-sm w-[90%] font-semibold text-xs whitespace-normal outline-none transition-colors duration-300";
  
  const themeClass = type === 'error'
    ? (isDark ? 'bg-[#18191a] text-red-300 border-red-500/30' : 'bg-white text-red-700 border-red-200 shadow-red-100')
    : (isDark ? 'bg-[#18191a] text-emerald-300 border-emerald-500/30' : 'bg-white text-emerald-700 border-emerald-200 shadow-emerald-100');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`${baseClass} ${themeClass}`}
      >
        <div className="shrink-0 flex items-center justify-center">
          {type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          )}
        </div>
        
        <p className="flex-grow select-text leading-relaxed">{message}</p>
        
        <button
          onClick={onClose}
          className={`cursor-pointer select-none p-1 rounded-lg transition-colors ${
            isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}