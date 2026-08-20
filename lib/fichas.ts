import type { SupabaseClient } from '@supabase/supabase-js';

/** A partir de quantas fichas o responsável deve ser chamado pra conversar. */
export const LIMITE_CHAMAR_RESPONSAVEL = 3;

export async function emitirFicha(
  supabase: SupabaseClient,
  params: { alunoId: string; motivo: string; autorId: string; origem?: string }
) {
  return supabase.from('fichas').insert({
    aluno_id: params.alunoId,
    motivo: params.motivo,
    autor_id: params.autorId,
    origem: params.origem ?? 'manual',
  });
}
