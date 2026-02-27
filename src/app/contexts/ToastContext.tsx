import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface ToastContextType {
  addToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const configs = {
    error:   { icon: AlertCircle, bg: '#B3261E' },
    success: { icon: CheckCircle, bg: '#2E7D32' },
    info:    { icon: Info,         bg: '#1565C0' },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center gap-2 z-50 px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            const { icon: Icon, bg } = configs[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 1, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl max-w-[400px] w-full pointer-events-auto"
                style={{ background: bg, fontFamily: 'Roboto, sans-serif' }}
              >
                <Icon size={18} color="white" className="shrink-0" />
                <span style={{ flex: 1, fontSize: '14px', color: 'white', lineHeight: 1.4 }}>{toast.message}</span>
                <button onClick={() => remove(toast.id)} className="shrink-0 opacity-80 hover:opacity-100">
                  <X size={16} color="white" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
