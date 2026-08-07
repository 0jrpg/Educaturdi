-- ════════════════════════════════════════════════════════════
--  MIGRAÇÃO v3 — CORRIGE RECURSÃO INFINITA NA POLICY DE PROFILES
--  Execute isso no SQL Editor do Supabase AGORA. É essa a causa
--  mais provável do login/dashboard ficarem travados "carregando".
--  Seguro rodar mais de uma vez.
-- ════════════════════════════════════════════════════════════

-- A policy "Admin gerencia qualquer perfil" (criada no migration_v2.sql)
-- consultava a própria tabela profiles por dentro dela mesma. O Postgres
-- não permite isso numa policy comum — ele detecta como referência
-- circular e a consulta trava/erra. A correção usa uma função
-- SECURITY DEFINER, que consulta profiles com privilégio elevado (sem
-- reativar a RLS por dentro), então não há mais recursão.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and tipo = 'admin'
  );
$$;

drop policy if exists "Admin gerencia qualquer perfil" on public.profiles;
create policy "Admin gerencia qualquer perfil"
  on public.profiles for all
  to authenticated
  using (public.is_admin());

-- ════════════════════════════════════════════════════════════
--  PRONTO! Depois de rodar isso, teste o login de novo.
-- ════════════════════════════════════════════════════════════
