import { createClient } from '@/lib/supabase/server';
import type { Prova, Disciplina, Turma, ProvaTentativa } from '@/types/database';
import ProvasClient from './ProvasClient';

export default async function ProvasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const isAluno = profile?.tipo === 'aluno';

  const { data: disciplinas } = await supabase.from('disciplinas').select('*');
  const { data: turmas } = await supabase.from('turmas').select('*').order('id');
  const { data: provasRaw } = await supabase.from('provas').select('*').order('created_at', { ascending: false });
  const provas = (provasRaw as Prova[] | null) ?? [];

  let minhasTentativas: Record<string, ProvaTentativa> = {};
  let tentativasPorProva: Record<string, any[]> = {};

  if (isAluno) {
    const { data } = await supabase.from('prova_tentativas').select('*').eq('aluno_id', user!.id);
    for (const t of (data as ProvaTentativa[] | null) ?? []) minhasTentativas[t.prova_id] = t;
  } else {
    const { data } = await supabase.from('prova_tentativas').select('*, aluno:profiles(nome, turma)').order('iniciada_em', { ascending: false });
    for (const t of (data as any[] | null) ?? []) {
      if (!tentativasPorProva[t.prova_id]) tentativasPorProva[t.prova_id] = [];
      tentativasPorProva[t.prova_id].push(t);
    }
  }

  return (
    <ProvasClient
      provas={provas}
      disciplinas={(disciplinas as Disciplina[] | null) ?? []}
      turmas={(turmas as Turma[] | null) ?? []}
      isAluno={isAluno}
      podeGerenciar={profile?.tipo === 'professor' || profile?.tipo === 'admin'}
      turma={profile?.turma ?? null}
      professorId={user!.id}
      minhasTentativas={minhasTentativas}
      tentativasPorProva={tentativasPorProva}
    />
  );
}
