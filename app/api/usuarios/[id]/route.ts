import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function checarAdmin() {
  // Ajustado para o Next.js 15 (await no createClient se o seu server.ts for async)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, msg: 'Não autenticado.' };

  const { data: profile } = await supabase.from('profiles').select('tipo').eq('id', user.id).single();
  if (profile?.tipo !== 'admin') return { ok: false as const, status: 403, msg: 'Apenas administradores podem fazer isso.' };

  return { ok: true as const, currentUserId: user.id };
}

export async function PATCH(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await checarAdmin();
  if (!check.ok) return NextResponse.json({ error: check.msg }, { status: check.status });

  // Await obrigatório no params para o Next.js 15+
  const { id } = await params;

  const body = await request.json();
  const { nome, tipo, turma, senha } = body;

  const admin = createAdminClient();

  const updatePayload: any = {};
  if (senha) {
    if (senha.length < 6) return NextResponse.json({ error: 'Senha precisa ter ao menos 6 caracteres.' }, { status: 400 });
    updatePayload.password = senha;
  }
  if (nome || tipo || turma !== undefined) {
    updatePayload.user_metadata = { nome, tipo, turma: tipo === 'aluno' ? turma : null };
  }

  const { error } = await admin.auth.admin.updateUserById(id, updatePayload);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Sincroniza a tabela profiles também
  if (nome || tipo || turma !== undefined) {
    await admin.from('profiles').update({ nome, tipo, turma: tipo === 'aluno' ? turma : null }).eq('id', id);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await checarAdmin();
  if (!check.ok) return NextResponse.json({ error: check.msg }, { status: check.status });

  // Await obrigatório no params para o Next.js 15+
  const { id } = await params;

  if (id === check.currentUserId) {
    return NextResponse.json({ error: 'Você não pode excluir a própria conta por aqui.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
