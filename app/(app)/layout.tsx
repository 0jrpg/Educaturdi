import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import { registrarPresencaServidor } from '@/lib/presence-server';
import type { Profile } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Usuário existe no Auth mas não tem profile (raro — trigger falhou)
    redirect('/login');
  }

  // Registra presença no servidor (ver lib/presence-server.ts pra entender
  // por que isso é feito aqui, e não só pelo heartbeat do navegador).
  await registrarPresencaServidor(supabase, user.id);

  return (
    <AppShell profile={profile as Profile} email={user.email ?? ''}>
      {children}
    </AppShell>
  );
}
