'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Roda em toda a área logada (dentro do AppShell). Se o aluno tem uma prova
 * em andamento (iniciada, não finalizada, dentro do tempo), e ele tenta
 * navegar pra qualquer outra página do site, isso detecta e manda ele de
 * volta pra tela da prova — não dá pra "escapar" navegando por dentro do
 * próprio EducaTurdi enquanto o cronômetro está rodando.
 */
export function useTentativaAtivaGuard(alunoId: string, ativo: boolean) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ativo) return;
    let cancelado = false;

    async function checar() {
      const supabase = createClient();
      const { data } = await supabase
        .from('prova_tentativas')
        .select('id, prova_id, termina_em')
        .eq('aluno_id', alunoId)
        .is('finalizada_em', null)
        .gt('termina_em', new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (cancelado || !data) return;
      const rotaEsperada = `/provas/${data.prova_id}/fazer`;
      if (pathname !== rotaEsperada) router.replace(rotaEsperada);
    }
    checar();

    return () => { cancelado = true; };
  }, [pathname, alunoId, ativo, router]);
}
