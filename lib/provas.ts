import type { SupabaseClient } from '@supabase/supabase-js';

export const PENALIDADE_MINUTOS = 5;

export function calcularSegundosRestantes(terminaEm: string): number {
  return Math.max(0, Math.floor((new Date(terminaEm).getTime() - Date.now()) / 1000));
}

export function formatarTempo(segundosTotais: number): string {
  const m = Math.floor(segundosTotais / 60);
  const s = segundosTotais % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export async function iniciarTentativa(supabase: SupabaseClient, provaId: string, alunoId: string, duracaoMinutos: number) {
  const termina = new Date(Date.now() + duracaoMinutos * 60_000).toISOString();
  return supabase.from('prova_tentativas').insert({ prova_id: provaId, aluno_id: alunoId, termina_em: termina }).select().single();
}

/** Desconta 5 minutos do tempo restante — chamado quando o aluno sai da
 * prova (troca de aba, minimiza, navega pra outra página do site) e volta. */
export async function aplicarPenalidade(
  supabase: SupabaseClient, tentativaId: string, terminaEmAtual: string, penalidadesAtuais: number
) {
  const novoTermino = new Date(new Date(terminaEmAtual).getTime() - PENALIDADE_MINUTOS * 60_000);
  const expirou = novoTermino.getTime() <= Date.now();
  const payload: any = { termina_em: novoTermino.toISOString(), penalidades: penalidadesAtuais + 1 };
  if (expirou) payload.finalizada_em = new Date().toISOString();
  const { data } = await supabase.from('prova_tentativas').update(payload).eq('id', tentativaId).select().single();
  return { expirou, tentativa: data };
}

export async function salvarResposta(supabase: SupabaseClient, tentativaId: string, resposta: string, arquivoUrl?: string | null) {
  const payload: Record<string, any> = { resposta };
  if (arquivoUrl !== undefined) payload.arquivo_url = arquivoUrl;
  return supabase.from('prova_tentativas').update(payload).eq('id', tentativaId);
}

export async function finalizarTentativa(supabase: SupabaseClient, tentativaId: string) {
  return supabase.from('prova_tentativas').update({ finalizada_em: new Date().toISOString() }).eq('id', tentativaId);
}
