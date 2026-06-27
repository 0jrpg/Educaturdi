import { createClient } from '@/lib/supabase/server';
import type { Apostila, Disciplina } from '@/types/database';
import ApostilasClient from './ApostilasClient';

export default async function ApostilasPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  const { data: disciplinas } = await supabase.from('disciplinas').select('*');
  const { data: apostilasRaw } = await supabase.from('apostilas').select('*').order('created_at', { ascending: false });

  return (
    <ApostilasClient
      apostilas={(apostilasRaw as Apostila[] | null) ?? []}
      disciplinas={(disciplinas as Disciplina[] | null) ?? []}
      isAluno={profile?.tipo === 'aluno'}
    />
  );
}
