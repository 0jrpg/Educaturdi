'use client';

import { IconX } from '@tabler/icons-react';

export default function Modal({
  open, onClose, title, children, footer, maxWidth = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}) {
  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 24, boxShadow: 'var(--sh-lg)', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem', borderBottom: '1px solid var(--s100)', position: 'sticky', top: 0, background: '#fff' }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h2>
          <button className="btn btn-ghost" onClick={onClose} type="button"><IconX size={18} /></button>
        </div>
        <div style={{ padding: '1.4rem' }}>{children}</div>
        {footer && (
          <div style={{ padding: '1.1rem 1.4rem', borderTop: '1px solid var(--s100)', display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
