import { createClient } from '@/lib/supabase/server';
import type { Nota, Disciplina, Profile } from '@/types/database';
import NotasClient from './NotasClient';

export default async function NotasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const { data: disciplinas } = await supabase.from('disciplinas').select('*');

  if (profile?.tipo === 'aluno') {
    const { data: notas } = await supabase.from('notas').select('*').eq('aluno_id', user!.id);
    return (
      <NotasClient
        modo="aluno"
        turmaAtual={profile.turma ?? ''}
        notasPorAluno={{ [profile.turma ?? '']: (notas as Nota[] | null) ?? [] }}
        disciplinas={(disciplinas as Disciplina[] | null) ?? []}
        turmas={[]}
      />
    );
  }

  // Professor/admin: busca notas agrupadas por turma (via profiles + notas)
  const { data: turmas } = await supabase.from('turmas').select('*');
  const { data: alunos } = await supabase.from('profiles').select('*').eq('tipo', 'aluno');

  const notasPorAluno: Record<string, Nota[]> = {};
  for (const t of turmas ?? []) {
    const idsAlunosDaTurma = (alunos as Profile[] | null)?.filter(a => a.turma === t.id).map(a => a.id) ?? [];
    if (!idsAlunosDaTurma.length) { notasPorAluno[t.id] = []; continue; }
    // Para simplificar a visão agregada do professor, pegamos as notas do primeiro aluno como representativo
    // (em um sistema real, você teria uma view agregada — aqui mantemos simples)
    const { data: notasTurma } = await supabase.from('notas').select('*').in('aluno_id', idsAlunosDaTurma);
    notasPorAluno[t.id] = (notasTurma as Nota[] | null) ?? [];
  }

  return (
    <NotasClient
      modo="gestao"
      turmaAtual=""
      notasPorAluno={notasPorAluno}
      disciplinas={(disciplinas as Disciplina[] | null) ?? []}
      turmas={(turmas ?? []).map(t => t.id)}
    />
  );
}
