'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Faz o login no SERVIDOR (Server Action) em vez de no navegador.
 * Isso é importante: quando o login acontece no servidor, o cookie de
 * sessão é gravado direto no cabeçalho da resposta HTTP (Set-Cookie),
 * de forma garantida. Fazer isso no navegador (client-side) depende de
 * timing entre o JS gravar o cookie e a navegação seguinte acontecer —
 * e foi exatamente isso que estava falhando (login "funcionava" mas
 * nenhum cookie de sessão era criado a tempo).
 */
export async function signInAction(email: string, senha: string): Promise<{ error?: string }> {
  if (!email || !senha) {
    return { error: 'Preencha e-mail e senha.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return {
      error: error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message,
    };
  }

  // redirect() lança um sinal especial que o Next.js trata sozinho —
  // o cookie de sessão já vai junto na resposta desse redirecionamento.
  redirect('/dashboard');
}
