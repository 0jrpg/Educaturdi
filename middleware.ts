import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Resposta "padrão" (deixa a página seguir normalmente).
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Repassa os cookies pro request (pra getUser() mais abaixo já
          // enxergar o token atualizado) e monta a resposta "padrão" com eles.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Loga no painel da Vercel (Deployments → seu deploy → Runtime Logs)
      // pra dar pra ver exatamente o que a Supabase respondeu.
      console.error('[middleware] auth.getUser() erro:', error.message);
    }
    user = data.user;
  } catch (e) {
    console.error('[middleware] auth.getUser() lançou exceção:', e);
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                       request.nextUrl.pathname.startsWith('/auth');

  // ⚠️ IMPORTANTE: sempre que a Auth renova o token de sessão, os novos
  // cookies só existem em `supabaseResponse`. Se a gente redirecionar
  // criando um NextResponse.redirect(...) do zero, esses cookies novos
  // se perdem — o navegador continua com o cookie antigo/expirado, a
  // próxima requisição falha de novo, e o resultado é um loop infinito
  // de redirecionamento (ERR_TOO_MANY_REDIRECTS). Por isso, toda vez
  // que redirecionamos, copiamos os cookies de supabaseResponse antes.
  function redirecionarPara(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // Não logado tentando acessar área protegida → manda pro login
  if (!user && !isAuthRoute) {
    return redirecionarPara('/login');
  }

  // Logado tentando acessar /login → manda pro dashboard
  if (user && request.nextUrl.pathname === '/login') {
    return redirecionarPara('/dashboard');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 1. Ignora os caminhos internos do Next.js (_next/static e _next/image).
     * 2. Libera APENAS o ícone da tela de login (^app/login/icon\\.svg$).
     * Todo o resto exigirá login pelo Supabase (Dashboard, uploads, turmas, etc).
     */
    '/((?!_next/static|_next/image|^app/login/icon\\.svg$).*)',
  ],
};

