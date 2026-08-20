'use client';

import { calcularStatus, formatarUltimoAcesso, descreverAtividadeAtual } from '@/lib/presence';

const CORES = {
  online: '#22c55e',
  ausente: '#f59e0b',
  offline: '#94a3b8',
};

/** Bolinha de status simples — sem texto, pra usar dentro de avatares/tabelas compactas. */
export function StatusDotSimples({ lastSeen, size = 9 }: { lastSeen: string | null | undefined; size?: number }) {
  const status = calcularStatus(lastSeen);
  return (
    <span
      title={status === 'online' ? 'Online agora' : status === 'ausente' ? 'Ausente' : `Offline · ${formatarUltimoAcesso(lastSeen)}`}
      style={{
        display: 'inline-block', width: size, height: size, borderRadius: '50%',
        background: CORES[status], border: '2px solid #fff', flexShrink: 0,
        boxShadow: status === 'online' ? `0 0 0 3px ${CORES.online}22` : 'none',
        animation: status === 'online' ? 'pulse 2s infinite' : 'none',
      }}
    />
  );
}

/** Bolinha + texto completo (status, última vez visto, o que está fazendo). Uso em tabelas/cards de gestão. */
export default function StatusPresenca({
  lastSeen, pagina, contextoTipo, contextoTitulo, compacto = false,
}: {
  lastSeen: string | null | undefined;
  pagina?: string | null;
  contextoTipo?: string | null;
  contextoTitulo?: string | null;
  compacto?: boolean;
}) {
  const status = calcularStatus(lastSeen);
  const atividade = descreverAtividadeAtual({ pagina, contexto_tipo: contextoTipo, contexto_titulo: contextoTitulo });

  const label = status === 'online'
    ? (atividade ?? 'Online agora')
    : status === 'ausente'
      ? `Ausente · ${formatarUltimoAcesso(lastSeen)}`
      : formatarUltimoAcesso(lastSeen);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <StatusDotSimples lastSeen={lastSeen} />
      <span
        style={{
          fontSize: compacto ? 11.5 : 12.5,
          color: status === 'online' ? '#16a34a' : status === 'ausente' ? '#b45309' : 'var(--s400)',
          fontWeight: status === 'online' ? 600 : 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
        title={label}
      >
        {label}
      </span>
    </div>
  );
}
