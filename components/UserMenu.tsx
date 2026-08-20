'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { IconChevronDown, IconUserCircle, IconLogout } from '@tabler/icons-react';

export default function UserMenu({
  nome, initials, roleLabel, onLogout,
}: { nome: string; initials: string; roleLabel: string; onLogout: () => void }) {
  const [aberto, setAberto] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  function abrir() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setAberto(true);
  }
  function fecharComAtraso() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setAberto(false), 200);
  }

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', onClickFora);
    return () => document.removeEventListener('mousedown', onClickFora);
  }, []);

  return (
    <div className="user-menu-wrap" ref={ref} onMouseEnter={abrir} onMouseLeave={fecharComAtraso}>
      <button className="tb-avatar-btn" onClick={() => setAberto((a) => !a)}>
        <div className="avatar avatar-sm">{initials}</div>
        <span className="hide-xs tb-avatar-name">{nome}</span>
        <IconChevronDown size={14} className={`user-menu-chevron ${aberto ? 'up' : ''}`} />
      </button>

      {aberto && (
        <div className="user-menu-panel" onMouseEnter={abrir} onMouseLeave={fecharComAtraso}>
          <div className="user-menu-header">
            <div className="avatar avatar-md">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="user-menu-name">{nome}</div>
              <div className="user-menu-role">{roleLabel}</div>
            </div>
          </div>
          <div className="user-menu-divider" />
          <Link href="/perfil" className="user-menu-item" onClick={() => setAberto(false)}>
            <IconUserCircle size={16} /> Meu Perfil
          </Link>
          <button className="user-menu-item danger" onClick={onLogout}>
            <IconLogout size={16} /> Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}
