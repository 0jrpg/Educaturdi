import { createClient } from '@/lib/supabase/server';
import type { Horario, Disciplina } from '@/types/database';
import HorarioClient from './HorarioClient';

export default async function HorarioPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const { data: disciplinas } = await supabase.from('disciplinas').select('*');
  const { data: turmasRaw } = await supabase.from('turmas').select('id');
  const turmas = (turmasRaw ?? []).map(t => t.id as string);

  const isAluno = profile?.tipo === 'aluno';
  const turmasParaCarregar = isAluno ? [profile?.turma ?? ''] : turmas;

  const horariosPorTurma: Record<string, Horario[]> = {};
  for (const t of turmasParaCarregar) {
    if (!t) continue;
    const { data } = await supabase.from('horarios').select('*').eq('turma', t).order('dia').order('ordem');
    horariosPorTurma[t] = (data as Horario[] | null) ?? [];
  }

  return (
    <HorarioClient
      isAluno={isAluno}
      turmaAtual={profile?.turma ?? ''}
      turmas={turmas}
      horariosPorTurma={horariosPorTurma}
      disciplinas={(disciplinas as Disciplina[] | null) ?? []}
    />
  );
}
