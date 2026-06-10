import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "SUCCESS" | "WARNING" | "SYS";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  isExiting: boolean;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const TYPE_COLORS: Record<ToastType, string> = {
  SUCCESS: "border-brand-green text-brand-green",
  WARNING: "border-brand-orange text-brand-orange",
  SYS: "border-brand-blue text-brand-blue",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "SYS") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, isExiting: false }]);

    // Start fade-out after 2800ms
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
    }, 2800);

    // Remove from DOM after fade completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3100);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="alert"
            aria-atomic="true"
            className={`pointer-events-auto bg-brand-dark border border-brand-border border-l-4 px-4 py-3 min-w-[280px] max-w-[380px] shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-opacity duration-300 ${TYPE_COLORS[toast.type]} ${toast.isExiting ? "opacity-0" : "opacity-100"}`}
          >
            <span className="text-[9px] font-mono font-extrabold tracking-[0.2em] block mb-0.5 opacity-70">
              [{toast.type}]
            </span>
            <span className="text-[10px] font-mono tracking-widest font-bold text-white leading-relaxed">
              {toast.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
