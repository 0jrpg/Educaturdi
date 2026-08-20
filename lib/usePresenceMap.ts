'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PresenceRow } from '@/lib/presence';

/**
 * Busca a presença de todo mundo e mantém atualizada em tempo real (via
 * Supabase Realtime) + um "tick" a cada 15s pra forçar recálculo de textos
 * como "Há 2 min", que mudam mesmo sem nenhum dado novo chegar.
 */
export function usePresenceMap() {
  const [map, setMap] = useState<Record<string, PresenceRow>>({});
  const [, forcarAtualizacao] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let ativo = true;

    async function carregar() {
      const { data } = await supabase.from('presence').select('*');
      if (ativo && data) {
        const m: Record<string, PresenceRow> = {};
        for (const row of data as PresenceRow[]) m[row.user_id] = row;
        setMap(m);
      }
    }
    carregar();

    const channel = supabase
      .channel('presence-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, (payload) => {
        setMap((cur) => {
          const novo = { ...cur };
          if (payload.eventType === 'DELETE') {
            const old = payload.old as { user_id?: string };
            if (old.user_id) delete novo[old.user_id];
          } else {
            const row = payload.new as PresenceRow;
            novo[row.user_id] = row;
          }
          return novo;
        });
      })
      .subscribe();

    // Rede de segurança: além do tempo real, refaz a busca completa a cada
    // 30s. Isso corrige sozinho qualquer divergência caso o WebSocket do
    // Realtime não esteja entregando eventos (rede corporativa, bloqueador
    // de anúncios, etc.) — sem isso, a tela ficaria "presa" nos dados do
    // primeiro carregamento indefinidamente.
    const refetchInterval = setInterval(carregar, 30_000);
    const tickInterval = setInterval(() => forcarAtualizacao((t) => t + 1), 15_000);

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
      clearInterval(refetchInterval);
      clearInterval(tickInterval);
    };
  }, []);

  return map;
}
