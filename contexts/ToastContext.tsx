import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextData {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    const newToast = { id, message, type };

    setToasts((state) => [...state, newToast]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((state) => state.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto min-w-[300px] max-w-sm p-4 rounded-xl shadow-2xl border flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-right-full
              ${toast.type === 'success' ? 'bg-bg-secondary border-storm-green/30 text-text-primary' : ''}
              ${toast.type === 'error' ? 'bg-bg-secondary border-storm-red/30 text-text-primary' : ''}
              ${toast.type === 'info' ? 'bg-bg-secondary border-storm-cyan/30 text-text-primary' : ''}
            `}
          >
            <div className={`mt-0.5 ${
              toast.type === 'success' ? 'text-storm-green' : 
              toast.type === 'error' ? 'text-storm-red' : 'text-storm-cyan'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            
            <div className="flex-1">
              <h4 className={`font-bold text-sm ${
                toast.type === 'success' ? 'text-storm-green' : 
                toast.type === 'error' ? 'text-storm-red' : 'text-storm-cyan'
              }`}>
                {toast.type === 'success' ? 'Sucesso' : toast.type === 'error' ? 'Erro' : 'Informação'}
              </h4>
              <p className="text-sm text-text-secondary leading-tight mt-1">{toast.message}</p>
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};