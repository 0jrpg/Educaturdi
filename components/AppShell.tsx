'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import {
  IconSchool, IconLayoutDashboard, IconClipboardList, IconBooks,
  IconReportAnalytics, IconSpeakerphone, IconCalendar, IconUsers,
  IconUserCog, IconUserCircle, IconLogout, IconMenu2, IconBell,
  IconChevronDown, IconChevronRight,
} from '@tabler/icons-react';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Array<'aluno' | 'professor' | 'admin'>;
}

const NAV_GROUPS: { label: string; links: NavLink[] }[] = [
  {
    label: 'Principal',
    links: [
      { href: '/dashboard', label: 'Início', icon: <IconLayoutDashboard size={18} />, roles: ['aluno', 'professor', 'admin'] },
      { href: '/atividades', label: 'Atividades', icon: <IconClipboardList size={18} />, roles: ['aluno', 'professor', 'admin'] },
      { href: '/apostilas', label: 'Apostilas', icon: <IconBooks size={18} />, roles: ['aluno', 'professor', 'admin'] },
      { href: '/notas', label: 'Notas', icon: <IconReportAnalytics size={18} />, roles: ['aluno', 'professor', 'admin'] },
      { href: '/comunicados', label: 'Comunicados', icon: <IconSpeakerphone size={18} />, roles: ['aluno', 'professor', 'admin'] },
      { href: '/horario', label: 'Horário', icon: <IconCalendar size={18} />, roles: ['aluno', 'professor', 'admin'] },
    ],
  },
  {
    label: 'Gestão',
    links: [
      { href: '/turmas', label: 'Turmas', icon: <IconUsers size={18} />, roles: ['professor', 'admin'] },
      { href: '/usuarios', label: 'Usuários', icon: <IconUserCog size={18} />, roles: ['admin'] },
    ],
  },
  {
    label: 'Conta',
    links: [
      { href: '/perfil', label: 'Meu Perfil', icon: <IconUserCircle size={18} />, roles: ['aluno', 'professor', 'admin'] },
    ],
  },
];

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Início', '/atividades': 'Atividades', '/apostilas': 'Apostilas',
  '/notas': 'Notas', '/comunicados': 'Comunicados', '/horario': 'Horário',
  '/turmas': 'Turmas', '/usuarios': 'Usuários', '/perfil': 'Meu Perfil',
};

export default function AppShell({
  children, profile, email,
}: { children: React.ReactNode; profile: Profile; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = profile.nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const roleLabel = { aluno: `Aluno · Turma ${profile.turma}`, professor: 'Professor', admin: 'Administrador' }[profile.tipo];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div id="app-shell">
      <aside id="sidebar" className={sidebarOpen ? 'open' : ''}>
        <div className="sb-logo">
          <div className="sb-logo-icon"><IconSchool size={20} color="#fff" /></div>
          <div className="sb-logo-text">Educa<span>Turdi</span></div>
        </div>

        <nav>
          {NAV_GROUPS.map((group) => {
            const visible = group.links.filter(l => l.roles.includes(profile.tipo));
            if (!visible.length) return null;
            return (
              <div key={group.label}>
                <div className="sb-section-label">{group.label}</div>
                {visible.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`nav-item ${pathname === l.href ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {l.icon}
                    <span>{l.label}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sb-footer">
          <Link href="/perfil" className="sb-user">
            <div className="avatar" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sb-user-name">{profile.nome}</div>
              <div className="sb-user-role"><div className="role-dot" />{roleLabel}</div>
            </div>
          </Link>
          <button className="sb-logout" onClick={handleLogout}>
            <IconLogout size={14} /> Sair da conta
          </button>
        </div>
      </aside>

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div id="main-area">
        <header id="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button id="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <IconMenu2 size={20} />
            </button>
            <div className="tb-breadcrumb">
              <span className="tb-crumb" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconSchool size={16} /> EducaTurdi
              </span>
              <IconChevronRight size={14} style={{ color: 'var(--s300)' }} />
              <span className="tb-crumb-current">{PAGE_LABELS[pathname] ?? ''}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: 35, height: 35, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--s400)', cursor: 'pointer' }}>
              <IconBell size={19} />
              <div style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, background: 'var(--re500)', borderRadius: '50%', border: '2px solid #fff' }} />
            </div>
            <Link
              href="/perfil"
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 9px 3px 3px', borderRadius: 99, border: '1px solid var(--s200)' }}
            >
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{initials}</div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--s600)', maxWidth: 130, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.nome}
              </span>
              <IconChevronDown size={14} style={{ color: 'var(--s400)' }} />
            </Link>
          </div>
        </header>

        <main id="page-content">{children}</main>
      </div>
    </div>
  );
}
