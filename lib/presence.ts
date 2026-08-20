// Utilitários de presença — status online/ausente/offline calculado a
// partir de "last_seen", sem depender de um evento de "desconectou"
// (que é pouco confiável no navegador: fechar a aba não dispara nada
// garantido). Assim, o status nunca fica "preso" em online.

export type StatusPresenca = 'online' | 'ausente' | 'offline';

const LIMITE_ONLINE_MS = 60 * 1000;        // até 60s atrás → online
const LIMITE_AUSENTE_MS = 5 * 60 * 1000;   // até 5min atrás → ausente

export function calcularStatus(lastSeen: string | null | undefined): StatusPresenca {
  if (!lastSeen) return 'offline';
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff <= LIMITE_ONLINE_MS) return 'online';
  if (diff <= LIMITE_AUSENTE_MS) return 'ausente';
  return 'offline';
}

export function formatarUltimoAcesso(lastSeen: string | null | undefined): string {
  if (!lastSeen) return 'Nunca acessou';
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Ontem';
  if (diffD < 7) return `Há ${diffD} dias`;
  return new Date(lastSeen).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function descreverAtividadeAtual(p: {
  contexto_tipo?: string | null;
  contexto_titulo?: string | null;
  pagina?: string | null;
} | null | undefined): string | null {
  if (!p) return null;
  if (p.contexto_tipo && p.contexto_titulo) {
    const verbo = ({
      atividade: 'Respondendo', tarefa: 'Respondendo', trabalho: 'Respondendo',
      apostila: 'Lendo apostila', resumo: 'Lendo resumo', prova: 'Fazendo a prova',
    } as Record<string, string>)[p.contexto_tipo] ?? 'Vendo';
    return `${verbo}: ${p.contexto_titulo}`;
  }
  if (p.pagina) return `Em ${p.pagina}`;
  return null;
}

export interface PresenceRow {
  user_id: string;
  last_seen: string;
  pagina: string | null;
  contexto_tipo: string | null;
  contexto_titulo: string | null;
}
