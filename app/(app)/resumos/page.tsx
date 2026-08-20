import { createClient } from '@/lib/supabase/server';
import type { Resumo, Disciplina, Turma } from '@/types/database';
import ResumosClient from './ResumosClient';

export default async function ResumosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  const { data: disciplinas } = await supabase.from('disciplinas').select('*');
  const { data: turmas } = await supabase.from('turmas').select('*').order('id');
  const { data: resumosRaw } = await supabase.from('resumos').select('*').order('created_at', { ascending: false });

  return (
    <ResumosClient
      resumos={(resumosRaw as Resumo[] | null) ?? []}
      disciplinas={(disciplinas as Disciplina[] | null) ?? []}
      turmas={(turmas as Turma[] | null) ?? []}
      isAluno={profile?.tipo === 'aluno'}
      podeGerenciar={profile?.tipo === 'professor' || profile?.tipo === 'admin'}
      professorId={user!.id}
    />
  );
}
