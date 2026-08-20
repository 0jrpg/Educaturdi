import { createClient } from '@/lib/supabase/server';
import type { Ficha, Profile } from '@/types/database';
import FichasClient from './FichasClient';

export default async function FichasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const podeGerenciar = profile?.tipo === 'professor' || profile?.tipo === 'admin';

  if (!podeGerenciar) {
    const { data: minhasFichas } = await supabase
      .from('fichas').select('*, autor:profiles!fichas_autor_id_fkey(nome)')
      .eq('aluno_id', user!.id).order('created_at', { ascending: false });

    return (
      <FichasClient
        podeGerenciar={false}
        fichas={(minhasFichas as any[] | null) ?? []}
        alunos={[]}
        proprioAlunoId={user!.id}
      />
    );
  }

  const { data: alunos } = await supabase.from('profiles').select('*').eq('tipo', 'aluno').order('nome');
  const { data: todasFichas } = await supabase
    .from('fichas').select('*, aluno:profiles!fichas_aluno_id_fkey(nome, turma), autor:profiles!fichas_autor_id_fkey(nome)')
    .order('created_at', { ascending: false });

  return (
    <FichasClient
      podeGerenciar
      fichas={(todasFichas as any[] | null) ?? []}
      alunos={(alunos as Profile[] | null) ?? []}
      proprioAlunoId={user!.id}
    />
  );
}
