'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  IconBell, IconBooks, IconSpeakerphone, IconReportAnalytics, IconFileText, IconChecks, IconBellOff,
  IconClipboardList, IconBriefcase, IconFlag3, IconClockHour4,
} from '@tabler/icons-react';
import { useNotificacoes, tempoRelativo, type TipoNotificacao } from '@/lib/notificacoes';
import type { Profile } from '@/types/database';

const ICONES: Record<TipoNotificacao, React.ReactNode> = {
  apostila: <IconBooks size={15} />,
  comunicado: <IconSpeakerphone size={15} />,
  nota: <IconReportAnalytics size={15} />,
  resumo: <IconFileText size={15} />,
  tarefa: <IconClipboardList size={15} />,
  trabalho: <IconBriefcase size={15} />,
  ficha: <IconFlag3 size={15} />,
  prova: <IconClockHour4 size={15} />,
};
const CORES: Record<TipoNotificacao, string> = {
  apostila: 'var(--bl500)', comunicado: 'var(--am500)', nota: 'var(--g500)', resumo: 'var(--s500)',
  tarefa: 'var(--g500)', trabalho: 'var(--bl500)', ficha: 'var(--re500)', prova: 'var(--am500)',
};
const ROTAS: Record<TipoNotificacao, string> = {
  apostila: '/apostilas', comunicado: '/comunicados', nota: '/notas', resumo: '/resumos',
  tarefa: '/tarefas', trabalho: '/trabalhos', ficha: '/fichas', prova: '/provas',
};

export default function NotificationBell({ profile }: { profile: Profile }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notificacoes, naoLidas, carregando, marcarComoLida, marcarTodasComoLidas } =
    useNotificacoes(profile.id, profile.turma, profile.tipo === 'aluno');

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', onClickFora);
    return () => document.removeEventListener('mousedown', onClickFora);
  }, []);

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="tb-notif-btn" onClick={() => setAberto((a) => !a)} title="Notificações">
        <IconBell size={19} />
        {naoLidas > 0 && <span className="tb-notif-dot">{naoLidas > 9 ? '9+' : naoLidas}</span>}
      </button>

      {aberto && (
        <div className="notif-panel">
          <div className="notif-panel-hd">
            <span>Notificações</span>
            {naoLidas > 0 && (
              <button className="notif-panel-marcar" onClick={marcarTodasComoLidas}>
                <IconChecks size={13} /> Marcar tudo como lido
              </button>
            )}
          </div>

          <div className="notif-panel-list">
            {carregando ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner spinner-sm" style={{ margin: '0 auto' }} /></div>
            ) : notificacoes.length === 0 ? (
              <div className="notif-empty">
                <IconBellOff size={26} />
                <p>Nenhuma notificação por aqui ainda</p>
              </div>
            ) : (
              notificacoes.map((n) => (
                <Link
                  key={n.id}
                  href={ROTAS[n.tipo] ?? '/dashboard'}
                  className={`notif-item ${n.lida ? '' : 'unread'}`}
                  onClick={() => { marcarComoLida(n.id); setAberto(false); }}
                >
                  <div className="notif-item-icon" style={{ background: `${CORES[n.tipo]}18`, color: CORES[n.tipo] }}>
                    {ICONES[n.tipo]}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="notif-item-title">{n.titulo}</div>
                    {n.descricao && <div className="notif-item-desc">{n.descricao}</div>}
                    <div className="notif-item-time">{tempoRelativo(n.created_at)}</div>
                  </div>
                  {!n.lida && <span className="notif-item-dot" />}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
