import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Garante que existe (ou atualiza) a linha de presença do usuário direto
 * no servidor, toda vez que uma página protegida é carregada.
 *
 * Por que isso existe: antes, a presença só era registrada pelo JavaScript
 * do navegador (heartbeat client-side). Isso cria uma janela de corrida —
 * se a pessoa fechar a aba rápido demais, ou o navegador atrasar o primeiro
 * heartbeat, a linha de presença nunca chega a ser criada, e a tela de
 * Usuários mostra "Nunca acessou" pra alguém que JÁ acessou o sistema
 * (só que a última visita nunca foi de fato gravada).
 *
 * Registrando também no servidor — que roda de forma síncrona antes da
 * página aparecer pro usuário — garantimos pelo menos UM registro real por
 * carregamento de página, sem depender de nenhum timing do navegador.
 */
export async function registrarPresencaServidor(supabase: SupabaseClient, userId: string) {
  try {
    await supabase.from('presence').upsert(
      { user_id: userId, last_seen: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  } catch {
    // Presença é "nice to have" — nunca deve impedir a página de carregar.
  }
}
