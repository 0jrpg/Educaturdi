import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UsuariosClient from './UsuariosClient';

export default async function UsuariosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('tipo').eq('id', user!.id).single();

  if (profile?.tipo !== 'admin') redirect('/dashboard');

  const { data: turmas } = await supabase.from('turmas').select('*').order('id');

  return <UsuariosClient turmas={(turmas ?? []).map(t => t.id as string)} />;
}
