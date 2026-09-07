import React, { useState, useCallback, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const icons: Record<ToastType, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const colors: Record<ToastType, string> = {
  success: 'bg-teal-700 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-700 text-white',
};

let nextId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container - top of screen, mobile friendly */}
      <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => dismiss(toast.id)}
            className={`${colors[toast.type]} flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl w-full max-w-sm pointer-events-auto animate-[fadeInDown_0.2s_ease] cursor-pointer`}
          >
            <div className="flex-shrink-0 bg-white/20 p-1 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icons[toast.type]} />
              </svg>
            </div>
            <p className="text-sm font-medium flex-1">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
