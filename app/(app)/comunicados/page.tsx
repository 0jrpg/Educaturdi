import { createClient } from '@/lib/supabase/server';
import type { Comunicado } from '@/types/database';
import ComunicadosClient from './ComunicadosClient';

export default async function ComunicadosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('tipo').eq('id', user!.id).single();

  const { data } = await supabase.from('comunicados').select('*').order('created_at', { ascending: false });

  return (
    <ComunicadosClient
      comunicados={(data as Comunicado[] | null) ?? []}
      podeGerenciar={profile?.tipo === 'professor' || profile?.tipo === 'admin'}
      autorId={user!.id}
    />
  );
}
