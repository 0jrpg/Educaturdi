import { createClient } from '@/lib/supabase/server';
import type { Turma, Profile } from '@/types/database';
import TurmasClient from './TurmasClient';

export default async function TurmasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  const { data: turmas } = await supabase.from('turmas').select('*').order('id');
  const { data: alunos } = await supabase.from('profiles').select('*').eq('tipo', 'aluno');

  const contagemAlunos: Record<string, number> = {};
  for (const a of (alunos as Profile[] | null) ?? []) {
    if (a.turma) contagemAlunos[a.turma] = (contagemAlunos[a.turma] ?? 0) + 1;
  }

  return (
    <TurmasClient
      turmas={(turmas as Turma[] | null) ?? []}
      contagemAlunos={contagemAlunos}
      podeGerenciar={profile?.tipo === 'admin'}
    />
  );
}
