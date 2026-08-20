import { createClient } from '@/lib/supabase/server';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  return <PerfilClient profile={profile!} email={user!.email ?? ''} />;
}
