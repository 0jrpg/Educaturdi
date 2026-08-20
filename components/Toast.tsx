'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { IconCircleCheck, IconAlertCircle, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';

type ToastType = 'success' | 'error' | 'warning' | 'default';
interface ToastItem { id: number; msg: string; type: ToastType; }

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <IconCircleCheck size={17} />,
  error: <IconAlertCircle size={17} />,
  warning: <IconAlertTriangle size={17} />,
  default: <IconInfoCircle size={17} />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((msg: string, type: ToastType = 'default') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div id="toast-container" style={{ position: 'fixed', bottom: 22, right: 22, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} style={toastStyle(t.type)}>
            {ICONS[t.type]} <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function toastStyle(type: ToastType): React.CSSProperties {
  const bg = { success: 'var(--g700)', error: 'var(--re700)', warning: 'var(--am700)', default: 'var(--s900)' }[type];
  return {
    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 17px',
    borderRadius: 10, background: bg, color: '#fff', fontSize: 14, fontWeight: 500,
    boxShadow: 'var(--sh-lg)', maxWidth: 340, animation: 'fadeUp .3s ease',
  };
}

export function useToast() {
  return useContext(ToastContext);
}
