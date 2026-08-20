```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import PresenceProvider from '@/components/PresenceProvider';
import NotificationBell from '@/components/NotificationBell';
import UserMenu from '@/components/UserMenu';
import { useTentativaAtivaGuard } from '@/lib/useTentativaAtivaGuard';
import {
  IconSchool, IconLayoutDashboard, IconClipboardList, IconBooks,
  IconReportAnalytics, IconSpeakerphone, IconCalendar, IconUsers,
  IconUserCog, IconUserCircle, IconLogout, IconMenu2,
  IconChevronRight, IconFileText, IconBriefcase, IconFlag3, IconClockHour4,
  IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand,
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
      {
        href: '/dashboard',
        label: 'Início',
        icon: <IconLayoutDashboard size={17} />,
        roles: ['aluno', 'professor', 'admin'],
      },
      {
        href: '/tarefas',
        label: 'Tarefas',
        icon: <IconClipboardList size={17} />,
        roles: ['aluno', 'professor', 'admin'],
      },
      {
        href: '/trabalhos',
        label: 'Trabalhos',
        icon: <IconBriefcase size={17} />,
        roles: ['aluno', 'professor', 'admin'],
      },
      {
        href: '/provas',
        label: 'Provas',
        icon: <IconClockHour4 size={17} />,
        roles: ['aluno', 'professor', 'admin'],
      },
      {
        href: '/apostilas',
        label: 'Apostilas',
        icon: <IconBooks size={17} />,
        roles: ['aluno', 'professor', 'admin'],
      },
      {
        href: '/resumos',
        label: 'Resumos',
        icon: <IconFileText size={17} />,
        roles: ['aluno', 'professor', 'admin'],
      },
      {
        href: '/notas',
        label: 'Notas',
        icon: <IconReportAnalytics size={17} />,
        roles: ['aluno', 'professor', 'admin'],
      },
      {
        href: '/comunicados',
        label: 'Comunicados',
        icon: <IconSpeakerphone size={17} />,
        roles: ['aluno', 'professor', 'admin'],
      },
      {
        href: '/horario',
        label: 'Horário',
        icon: <IconCalendar size={17} />,
        roles: ['aluno', 'professor', 'admin'],
      },
      {
        href: '/fichas',
        label: 'Fichas',
        icon: <IconFlag3 size={17} />,
        roles: ['aluno', 'professor', 'admin'],
      },
    ],
  },
  {
    label: 'Gestão',
    links: [
      {
        href: '/turmas',
        label: 'Turmas',
        icon: <IconUsers size={17} />,
        roles: ['professor', 'admin'],
      },
      {
        href: '/disciplinas',
        label: 'Disciplinas',
        icon: <IconBooks size={17} />,
        roles: ['admin'],
      },
      {
        href: '/usuarios',
        label: 'Usuários',
        icon: <IconUserCog size={17} />,
        roles: ['admin'],
      },
    ],
  },
  {
    label: 'Conta',
    links: [
      {
        href: '/perfil',
        label: 'Meu Perfil',
        icon: <IconUserCircle size={17} />,
        roles: ['aluno', 'professor', 'admin'],
      },
    ],
  },
];

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Início',
  '/tarefas': 'Tarefas',
  '/trabalhos': 'Trabalhos',
  '/provas': 'Provas',
  '/apostilas': 'Apostilas',
  '/resumos': 'Resumos',
  '/notas': 'Notas',
  '/comunicados': 'Comunicados',
  '/horario': 'Horário',
  '/turmas': 'Turmas',
  '/disciplinas': 'Disciplinas',
  '/usuarios': 'Usuários',
  '/perfil': 'Meu Perfil',
  '/fichas': 'Fichas',
};

const LS_KEY = 'et_sidebar_pinned';

export default function AppShell({
  children,
  profile,
  email,
}: {
  children: React.ReactNode;
  profile: Profile;
  email: string;
}) {
  const pathname = usePathname();
  const supabase = createClient();

  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [pinned, setPinned] = useState(true);
  const [peek, setPeek] = useState(false);
  const [prontoParaAnimar, setProntoParaAnimar] = useState(false);

  const peekTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carrega a preferência salva (sem animação no primeiro render, pra
  // não "piscar" a barra lateral abrindo/fechando ao carregar a página).
  useEffect(() => {
    const saved =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(LS_KEY)
        : null;

    if (saved === '0') setPinned(false);

    const t = setTimeout(() => setProntoParaAnimar(true), 50);

    return () => clearTimeout(t);
  }, []);

  // Define o favicon de acordo com a página atual.
  //
  // Dashboard:
  //   /app/icon.svg
  //
  // Outras páginas:
  //   /app/[rota]/icon.svg
  //
  // Exemplo:
  //   /apostilas → /app/apostilas/icon.svg
  //   /turmas    → /app/turmas/icon.svg
  //   /provas    → /app/provas/icon.svg
  useEffect(() => {
    const iconPath =
      pathname === '/dashboard'
        ? '/app/icon.svg'
        : `/app${pathname}/icon.svg`;

    const iconUrl = `${window.location.origin}${iconPath}`;

    // Remove os favicons anteriores para evitar conflitos
    // com os ícones que o Next.js possa ter colocado.
    document
      .querySelectorAll(
        'link[rel="icon"], link[rel="shortcut icon"]'
      )
      .forEach((element) => element.remove());

    // Cria o favicon da página atual.
    const favicon = document.createElement('link');

    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = iconUrl;

    document.head.appendChild(favicon);

    return () => {
      favicon.remove();
    };
  }, [pathname]);

  function togglePinned() {
    setPinned((atual) => {
      const novo = !atual;

      window.localStorage.setItem(
        LS_KEY,
        novo ? '1' : '0'
      );

      return novo;
    });

    setPeek(false);
  }

  function abrirPeek() {
    if (peekTimeout.current) {
      clearTimeout(peekTimeout.current);
    }

    setPeek(true);
  }

  function fecharPeekComAtraso() {
    if (peekTimeout.current) {
      clearTimeout(peekTimeout.current);
    }

    peekTimeout.current = setTimeout(
      () => setPeek(false),
      220
    );
  }

  const initials = profile.nome
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const roleLabel = {
    aluno: `Aluno · Turma ${profile.turma}`,
    professor: 'Professor',
    admin: 'Administrador',
  }[profile.tipo];

  useTentativaAtivaGuard(
    profile.id,
    profile.tipo === 'aluno'
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const sidebarClasses = [
    sidebarOpenMobile ? 'open' : '',
    pinned ? 'pinned' : 'unpinned',
    peek ? 'peek' : '',
    prontoParaAnimar ? 'ready' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Índice "achatado" de todos os links visíveis, só pra calcular o atraso
  // de animação de entrada de cada item (efeito cascata ao abrir o menu).
  let indiceGlobal = -1;

  return (
    <PresenceProvider userId={profile.id}>
      <div id="app-shell">
        {/* Faixa sensível ao mouse, na borda esquerda — só existe
            (visualmente invisível) quando o menu está desafixado,
            pra revelar a barra ao passar o mouse perto dela. */}
        {!pinned && (
          <div
            onMouseEnter={abrirPeek}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: 16,
              height: '100vh',
              zIndex: 150,
            }}
            className="sidebar-hotzone"
          />
        )}

        <aside
          id="sidebar"
          className={sidebarClasses}
          onMouseEnter={() => {
            if (!pinned) abrirPeek();
          }}
          onMouseLeave={() => {
            if (!pinned) fecharPeekComAtraso();
          }}
        >
          <div className="sb-logo">
            <div className="sb-logo-icon">
              <IconSchool size={20} color="#fff" />
            </div>

            <div>
              <div className="sb-logo-text">
                Educa<span>Turdi</span>
              </div>
            </div>
          </div>

          <nav className="sb-nav">
            {NAV_GROUPS.map((group) => {
              const visible = group.links.filter((l) =>
                l.roles.includes(profile.tipo)
              );

              if (!visible.length) return null;

              return (
                <div key={group.label}>
                  <div className="sb-section-label">
                    {group.label}
                  </div>

                  {visible.map((l) => {
                    indiceGlobal += 1;

                    const ativo = pathname === l.href;

                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        className={`nav-item ${
                          ativo ? 'active' : ''
                        }`}
                        style={{
                          animationDelay: `${
                            Math.min(
                              indiceGlobal * 0.03,
                              0.3
                            )
                          }s`,
                        }}
                        onClick={() =>
                          setSidebarOpenMobile(false)
                        }
                      >
                        <span className="nav-item-icon">
                          {l.icon}
                        </span>

                        <span className="nav-item-label">
                          {l.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <div className="sb-nav-fade" />

          <div className="sb-footer">
            <Link href="/perfil" className="sb-user">
              <div
                className="avatar"
                style={{
                  background: 'rgba(255,255,255,.15)',
                  color: '#fff',
                }}
              >
                {initials}
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div className="sb-user-name">
                  {profile.nome}
                </div>

                <div className="sb-user-role">
                  <div className="role-dot" />
                  {roleLabel}
                </div>
              </div>
            </Link>

            <button
              className="sb-logout"
              onClick={handleLogout}
            >
              <IconLogout size={14} />
              Sair da conta
            </button>
          </div>
        </aside>

        <div
          className={`sidebar-overlay ${
            sidebarOpenMobile ? 'open' : ''
          }`}
          onClick={() => setSidebarOpenMobile(false)}
        />

        <div
          id="main-area"
          style={{
            marginLeft: pinned
              ? 'var(--sidebar-w)'
              : 0,
          }}
        >
          <header id="topbar">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <button
                id="sidebar-toggle"
                onClick={() =>
                  setSidebarOpenMobile(
                    !sidebarOpenMobile
                  )
                }
              >
                <IconMenu2 size={20} />
              </button>

              <button
                id="sidebar-pin-toggle"
                onClick={togglePinned}
                title={
                  pinned
                    ? 'Ocultar menu (aparece ao passar o mouse na borda)'
                    : 'Fixar menu aberto'
                }
              >
                {pinned ? (
                  <IconLayoutSidebarLeftCollapse
                    size={19}
                  />
                ) : (
                  <IconLayoutSidebarLeftExpand
                    size={19}
                  />
                )}
              </button>

              <div className="tb-breadcrumb">
                <span
                  className="tb-crumb"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <IconSchool size={15} />

                  <span className="hide-xs tb-crumb-brand">
                    EducaTurdi
                  </span>
                </span>

                <IconChevronRight
                  size={14}
                  style={{
                    color: 'var(--s300)',
                  }}
                  className="hide-xs"
                />

                <span className="tb-crumb-current">
                  {PAGE_LABELS[pathname] ?? ''}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <NotificationBell profile={profile} />

              <UserMenu
                nome={profile.nome}
                initials={initials}
                roleLabel={roleLabel ?? ''}
                onLogout={handleLogout}
              />
            </div>
          </header>

          <main
            id="page-content"
            key={pathname}
          >
            {children}
          </main>
        </div>
      </div>
    </PresenceProvider>
  );
}
```
