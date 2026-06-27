import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
  const { data, error } = await admin.auth.admin.listUsers();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    users: data.users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      nome: u.user_metadata?.nome ?? u.email,
      tipo: u.user_metadata?.tipo ?? 'aluno',
      turma: u.user_metadata?.turma ?? null,
    })),
  });
}
