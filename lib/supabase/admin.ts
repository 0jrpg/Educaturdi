import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente administrativo do Supabase.
 *
 * ⚠️ NUNCA importe este arquivo em um Client Component ('use client').
 * Ele usa a service_role key, que ignora todo o Row Level Security.
 * Só pode ser usado dentro de API Routes (app/api/.../route.ts) ou
 * Server Actions, que rodam exclusivamente no servidor da Vercel.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
