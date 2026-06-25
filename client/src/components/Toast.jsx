import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded border px-4 py-2.5 text-sm ${
                t.type === 'error'
                  ? 'border-expense/40 bg-surface text-expense'
                  : 'border-border bg-surface text-ink'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastCtx);
  return toast ?? (() => {});
}
