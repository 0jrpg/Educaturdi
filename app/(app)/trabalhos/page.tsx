import { createClient } from '@/lib/supabase/server';
import type { Trabalho, Disciplina, Turma, Profile } from '@/types/database';
import TarefaTrabalhoClient from '@/components/TarefaTrabalhoClient';

function diasAte(iso: string) {
  return Math.ceil((new Date(`${iso}T23:59:59`).getTime() - Date.now()) / 86400000);
}

export default async function TrabalhosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const isAluno = profile?.tipo === 'aluno';

  const { data: disciplinas } = await supabase.from('disciplinas').select('*');
  const { data: turmas } = await supabase.from('turmas').select('*').order('id');
  const { data: trabalhosRaw } = await supabase.from('trabalhos').select('*').order('prazo');
  const trabalhos = (trabalhosRaw as Trabalho[] | null) ?? [];

  let entregasMap = new Map<string, string>();
  let respostasPorItem: Record<string, any[]> = {};
  let alunos: Profile[] = [];

  if (isAluno) {
    const { data: entregas } = await supabase.from('entregas_trabalho').select('*').eq('aluno_id', user!.id);
    entregasMap = new Map((entregas ?? []).map((e: any) => [e.trabalho_id, e.status]));
  } else {
    const { data: entregas } = await supabase.from('entregas_trabalho').select('*, aluno:profiles(nome, turma)').order('entregue_em', { ascending: false });
    for (const e of (entregas as any[] | null) ?? []) {
      if (!respostasPorItem[e.trabalho_id]) respostasPorItem[e.trabalho_id] = [];
      respostasPorItem[e.trabalho_id].push(e);
    }
    const { data: alunosData } = await supabase.from('profiles').select('*').eq('tipo', 'aluno').order('nome');
    alunos = (alunosData as Profile[] | null) ?? [];
  }

  const itensComStatus = trabalhos.map(t => ({
    ...t,
    status: isAluno
      ? (entregasMap.get(t.id) ?? (diasAte(t.prazo) < 0 ? 'atrasado' : 'pendente'))
      : 'pendente',
  }));

  return (
    <TarefaTrabalhoClient
      modo="trabalho"
      tabela="trabalhos"
      tabelaEntregas="entregas_trabalho"
      colunaFk="trabalho_id"
      itens={itensComStatus as any}
      disciplinas={(disciplinas as Disciplina[] | null) ?? []}
      turmas={(turmas as Turma[] | null) ?? []}
      isAluno={isAluno}
      podeGerenciar={profile?.tipo === 'professor' || profile?.tipo === 'admin'}
      turma={profile?.turma ?? null}
      alunoId={user!.id}
      respostasPorItem={respostasPorItem}
      alunos={alunos}
    />
  );
}
