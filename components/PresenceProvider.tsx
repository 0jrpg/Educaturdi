'use client';

import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const PAGINA_LABELS: Record<string, string> = {
  '/dashboard': 'Início', '/tarefas': 'Tarefas', '/trabalhos': 'Trabalhos', '/provas': 'Provas',
  '/apostilas': 'Apostilas', '/resumos': 'Resumos', '/notas': 'Notas', '/comunicados': 'Comunicados', '/horario': 'Horário',
  '/turmas': 'Turmas', '/disciplinas': 'Disciplinas', '/usuarios': 'Usuários', '/perfil': 'Meu Perfil', '/fichas': 'Fichas',
};

interface ContextoAtual {
  tipo: 'atividade' | 'apostila' | 'resumo' | 'tarefa' | 'trabalho' | 'prova';
  titulo: string;
}

const PresenceContext = createContext<{
  definirContexto: (ctx: ContextoAtual | null) => void;
}>({ definirContexto: () => {} });

/** Qualquer página pode chamar isso pra anunciar "estou vendo X" (some
 * automaticamente ao desmontar / trocar de página). */
export function usePresenceContext() {
  return useContext(PresenceContext).definirContexto;
}

const HEARTBEAT_MS = 20_000;

export default function PresenceProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = createClient();
  const contextoRef = useRef<ContextoAtual | null>(null);

  const enviarBatimento = useCallback(async (opts?: { ignorarVisibilidade?: boolean }) => {
    // Só pula o envio se a aba estiver em segundo plano E não formos ignorar
    // essa checagem — isso evita marcar como "online" alguém que só deixou
    // a aba aberta em background por horas.
    if (!opts?.ignorarVisibilidade && document.visibilityState !== 'visible') return;

    const ctx = contextoRef.current;
    const { error } = await supabase.from('presence').upsert({
      user_id: userId,
      last_seen: new Date().toISOString(),
      pagina: PAGINA_LABELS[pathname] ?? null,
      contexto_tipo: ctx?.tipo ?? null,
      contexto_titulo: ctx?.titulo ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) console.error('[presence] falha ao registrar:', error.message);
  }, [pathname, userId, supabase]);

  useEffect(() => {
    // O PRIMEIRO batimento de cada página sempre é enviado, mesmo que o
    // navegador reporte a aba como "não visível" nesse instante exato (pode
    // acontecer durante o carregamento inicial em alguns navegadores). Sem
    // isso, quem abre e fecha o site rápido pode nunca ter a presença
    // registrada — e aparecer como "nunca acessou" mesmo tendo acessado.
    enviarBatimento({ ignorarVisibilidade: true });

    const interval = setInterval(() => enviarBatimento(), HEARTBEAT_MS);

    // Quando a aba volta a ficar visível, manda um batimento na hora
    // (em vez de esperar até 20s), pra status "online" reagir rápido.
    const onVisible = () => { if (document.visibilityState === 'visible') enviarBatimento(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enviarBatimento]);

  const definirContexto = useCallback((ctx: ContextoAtual | null) => {
    contextoRef.current = ctx;
    enviarBatimento({ ignorarVisibilidade: true });
  }, [enviarBatimento]);

  return (
    <PresenceContext.Provider value={{ definirContexto }}>
      {children}
    </PresenceContext.Provider>
  );
}
