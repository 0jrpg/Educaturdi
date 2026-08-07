import { createClient } from '@/lib/supabase/server';
import type { Disciplina } from '@/types/database';
import DisciplinasClient from './DisciplinasClient';

export default async function DisciplinasPage() {
  const supabase = createClient();
  const { data: disciplinas } = await supabase.from('disciplinas').select('*').order('nome');

  return <DisciplinasClient disciplinas={(disciplinas as Disciplina[] | null) ?? []} />;
}
