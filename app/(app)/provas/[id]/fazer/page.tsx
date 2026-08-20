import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import type { Prova, ProvaTentativa } from '@/types/database';
import FazerProvaClient from './FazerProvaClient';

export const dynamic = 'force-dynamic';

export default async function FazerProvaPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  if (profile?.tipo !== 'aluno') redirect('/provas');

  const { data: prova } = await supabase.from('provas').select('*').eq('id', params.id).single();
  if (!prova) notFound();
  if (!(prova as Prova).turmas.includes(profile.turma ?? '')) redirect('/provas');

  const { data: tentativa } = await supabase
    .from('prova_tentativas').select('*').eq('prova_id', params.id).eq('aluno_id', user!.id).maybeSingle();

  return (
    <FazerProvaClient
      prova={prova as Prova}
      tentativaInicial={tentativa as ProvaTentativa | null}
      alunoId={user!.id}
    />
  );
}
