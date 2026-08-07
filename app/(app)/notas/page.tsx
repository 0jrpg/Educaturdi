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
        notasPorAluno={{}}
        alunosPorTurma={{}}
        notasDoAluno={(notas as Nota[] | null) ?? []}
        disciplinas={(disciplinas as Disciplina[] | null) ?? []}
        turmas={[]}
      />
    );
  }

  // Professor/admin: lista alunos de cada turma e as notas de cada um
  const { data: turmas } = await supabase.from('turmas').select('*').order('id');
  const { data: alunos } = await supabase.from('profiles').select('*').eq('tipo', 'aluno').order('nome');

  const alunosPorTurma: Record<string, Profile[]> = {};
  const notasPorAluno: Record<string, Nota[]> = {};

  for (const t of turmas ?? []) {
    const alunosDaTurma = (alunos as Profile[] | null)?.filter(a => a.turma === t.id) ?? [];
    alunosPorTurma[t.id] = alunosDaTurma;

    if (alunosDaTurma.length) {
      const { data: notasTurma } = await supabase.from('notas').select('*').in('aluno_id', alunosDaTurma.map(a => a.id));
      for (const a of alunosDaTurma) {
        notasPorAluno[a.id] = ((notasTurma as Nota[] | null) ?? []).filter(n => n.aluno_id === a.id);
      }
    }
  }

  return (
    <NotasClient
      modo="gestao"
      turmaAtual=""
      notasPorAluno={notasPorAluno}
      alunosPorTurma={alunosPorTurma}
      notasDoAluno={[]}
      disciplinas={(disciplinas as Disciplina[] | null) ?? []}
      turmas={(turmas ?? []).map(t => t.id)}
    />
  );
}
