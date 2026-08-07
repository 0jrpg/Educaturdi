import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { User } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function checarAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, msg: 'Não autenticado.' };

  const { data: profile } = await supabase.from('profiles').select('tipo').eq('id', user.id).single();
  if (profile?.tipo !== 'admin') return { ok: false as const, status: 403, msg: 'Apenas administradores podem fazer isso.' };

  return { ok: true as const };
}

export async function POST(request: Request) {
  const check = await checarAdmin();
  if (!check.ok) return NextResponse.json({ error: check.msg }, { status: check.status });

  const body = await request.json();
  const { email, senha, nome, tipo, turma } = body;

  if (!email || !senha || !nome || !tipo) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 });
  }
  if (!['aluno', 'professor', 'admin'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 });
  }
  if (tipo === 'aluno' && !turma) {
    return NextResponse.json({ error: 'Alunos precisam de uma turma.' }, { status: 400 });
  }
  if (senha.length < 6) {
    return NextResponse.json({ error: 'Senha precisa ter ao menos 6 caracteres.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true, // já vem confirmado, sem precisar de e-mail de verificação
    user_metadata: {
      nome,
      tipo,
      turma: tipo === 'aluno' ? turma : null,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user });
}

export async function GET() {
  const check = await checarAdmin();
  if (!check.ok) return NextResponse.json({ error: check.msg }, { status: check.status });

  const admin = createAdminClient();

  // A API do Supabase Auth pagina os resultados (padrão: 50 por página).
  // Se o número de contas passar disso, buscar só a primeira página faz
  // alunos/professores "sumirem" da lista. Por isso percorremos TODAS as
  // páginas até a Auth não devolver mais nada.
  const PER_PAGE = 1000;
  let page = 1;
  const todosAuthUsers: User[] = [];

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    todosAuthUsers.push(...data.users);
    if (data.users.length < PER_PAGE) break;
    page += 1;
  }

  // A tabela profiles é a fonte de verdade para nome/tipo/turma (é editada
  // diretamente pelo painel). Cruzamos com a Auth só para pegar e-mail e
  // data de criação — assim, mesmo que o user_metadata de alguém esteja
  // desatualizado ou ausente, o usuário continua aparecendo corretamente.
  const { data: profiles, error: profilesError } = await admin.from('profiles').select('*');
  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 400 });

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const users = todosAuthUsers.map((u) => {
    const perfil = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      nome: perfil?.nome ?? u.user_metadata?.nome ?? u.email,
      tipo: perfil?.tipo ?? u.user_metadata?.tipo ?? 'aluno',
      turma: perfil?.turma ?? u.user_metadata?.turma ?? null,
    };
  });

  users.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  return NextResponse.json({ users });
}
