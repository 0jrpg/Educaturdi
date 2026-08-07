import { createClient } from '@/lib/supabase/server';
import type { Atividade, Disciplina, Turma } from '@/types/database';
import AtividadesClient from './AtividadesClient';

function diasAte(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export default async function AtividadesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const isAluno = profile?.tipo === 'aluno';

  const { data: disciplinas } = await supabase.from('disciplinas').select('*');
  const { data: turmas } = await supabase.from('turmas').select('*').order('id');
  const { data: atividadesRaw } = await supabase.from('atividades').select('*').order('prazo');
  const atividades = (atividadesRaw as Atividade[] | null) ?? [];

  let entregasMap = new Map<string, string>();
  // Para professor/admin: todas as respostas de todos os alunos, agrupadas
  // por atividade, já com o nome/turma do aluno pra exibir.
  let respostasPorAtividade: Record<string, any[]> = {};

  if (isAluno) {
    const { data: entregas } = await supabase.from('entregas').select('*').eq('aluno_id', user!.id);
    entregasMap = new Map((entregas ?? []).map((e: any) => [e.atividade_id, e.status]));
  } else {
    const { data: entregas } = await supabase
      .from('entregas')
      .select('*, aluno:profiles(nome, turma)')
      .order('entregue_em', { ascending: false });
    for (const e of (entregas as any[] | null) ?? []) {
      if (!respostasPorAtividade[e.atividade_id]) respostasPorAtividade[e.atividade_id] = [];
      respostasPorAtividade[e.atividade_id].push(e);
    }
  }

  const ativsComStatus = atividades.map(a => ({
    ...a,
    status: isAluno
      ? (entregasMap.get(a.id) ?? (diasAte(a.prazo) < 0 ? 'atrasado' : 'pendente'))
      : 'pendente',
  }));

  return (
    <AtividadesClient
      atividades={ativsComStatus as any}
      disciplinas={(disciplinas as Disciplina[] | null) ?? []}
      turmas={(turmas as Turma[] | null) ?? []}
      isAluno={isAluno}
      podeGerenciar={profile?.tipo === 'professor' || profile?.tipo === 'admin'}
      turma={profile?.turma ?? null}
      alunoId={user!.id}
      respostasPorAtividade={respostasPorAtividade}
    />
  );
}
