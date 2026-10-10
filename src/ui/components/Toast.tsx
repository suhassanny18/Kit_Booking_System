import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { DomainError } from '../../domain/errors';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  title?: string;
  message: string;
  code?: string;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (type: 'error' | 'success' | 'info', message: string, title?: string, code?: string) => void;
  showDomainError: (err: unknown) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: 'error' | 'success' | 'info', message: string, title?: string, code?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastMessage = { id, type, title, message, code };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 6000);
  }, [removeToast]);

  const showDomainError = useCallback((err: unknown) => {
    if (err instanceof DomainError) {
      showToast('error', err.message, `Domain Error: ${err.code}`, err.code);
    } else if (err instanceof Error) {
      showToast('error', err.message, 'Error');
    } else {
      showToast('error', String(err), 'Unexpected Error');
    }
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, showDomainError, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all ${
                toast.type === 'error'
                  ? 'bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50'
                  : toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50'
                  : 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-black/50'
              }`}
            >
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}

              <div className="flex-1 min-w-0">
                {toast.title && (
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <span>{toast.title}</span>
                    {toast.code && (
                      <span className="font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-white/10 text-rose-300">
                        {toast.code}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-xs text-slate-200 mt-0.5 leading-relaxed break-words">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
