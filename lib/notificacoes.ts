'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type TipoNotificacao = 'apostila' | 'comunicado' | 'nota' | 'resumo' | 'tarefa' | 'trabalho' | 'ficha' | 'prova';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string | null;
  turmas: string[];
  autor_id: string | null;
  created_at: string;
}

export function tempoRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Ontem';
  if (diffD < 7) return `Há ${diffD} dias`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Cria uma notificação — chamado pelos modais de Nova Apostila, Novo
 * Comunicado e Lançar Notas logo depois de salvar com sucesso.
 * "turmas" vazio = aparece pra todo mundo (usado em comunicados).
 */
export async function criarNotificacao(
  supabase: ReturnType<typeof createClient>,
  params: { tipo: TipoNotificacao; titulo: string; descricao?: string | null; turmas?: string[]; autorId: string }
) {
  try {
    await supabase.from('notificacoes').insert({
      tipo: params.tipo,
      titulo: params.titulo,
      descricao: params.descricao ?? null,
      turmas: params.turmas ?? [],
      autor_id: params.autorId,
    });
  } catch {
    // Notificação é um "extra" — nunca deve travar o fluxo principal
    // (a apostila/comunicado/nota já foi salva de verdade nesse ponto).
  }
}

export function useNotificacoes(userId: string, turmaDoUsuario: string | null, souAluno: boolean) {
  const [todas, setTodas] = useState<Notificacao[]>([]);
  const [lidasIds, setLidasIds] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let ativo = true;

    async function carregar() {
      const [{ data: notifs }, { data: lidas }] = await Promise.all([
        supabase.from('notificacoes').select('*').order('created_at', { ascending: false }).limit(30),
        supabase.from('notificacoes_lidas').select('notificacao_id').eq('user_id', userId),
      ]);
      if (!ativo) return;
      setTodas((notifs as Notificacao[] | null) ?? []);
      setLidasIds(new Set((lidas ?? []).map((l: any) => l.notificacao_id)));
      setCarregando(false);
    }
    carregar();

    const channel = supabase
      .channel('notificacoes-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes' }, (payload) => {
        setTodas((cur) => [payload.new as Notificacao, ...cur].slice(0, 30));
      })
      .subscribe();

    const interval = setInterval(carregar, 45_000);

    return () => { ativo = false; supabase.removeChannel(channel); clearInterval(interval); };
  }, [userId]);

  // Aluno só vê notificações destinadas a "todo mundo" (turmas vazio) ou à
  // própria turma; professor/admin vê tudo, já que costuma gerenciar várias turmas.
  const visiveis = souAluno
    ? todas.filter(n => n.turmas.length === 0 || (turmaDoUsuario && n.turmas.includes(turmaDoUsuario)))
    : todas;

  const comLeitura = visiveis.map(n => ({ ...n, lida: lidasIds.has(n.id) }));
  const naoLidas = comLeitura.filter(n => !n.lida).length;

  async function marcarComoLida(notifId: string) {
    if (lidasIds.has(notifId)) return;
    setLidasIds((cur) => new Set(cur).add(notifId));
    const supabase = createClient();
    await supabase.from('notificacoes_lidas').upsert(
      { notificacao_id: notifId, user_id: userId },
      { onConflict: 'notificacao_id,user_id' }
    );
  }

  async function marcarTodasComoLidas() {
    const idsNaoLidos = comLeitura.filter(n => !n.lida).map(n => n.id);
    if (!idsNaoLidos.length) return;
    setLidasIds((cur) => { const novo = new Set(cur); idsNaoLidos.forEach(id => novo.add(id)); return novo; });
    const supabase = createClient();
    await supabase.from('notificacoes_lidas').upsert(
      idsNaoLidos.map(id => ({ notificacao_id: id, user_id: userId })),
      { onConflict: 'notificacao_id,user_id' }
    );
  }

  return { notificacoes: comLeitura, naoLidas, carregando, marcarComoLida, marcarTodasComoLidas };
}
