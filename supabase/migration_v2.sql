-- ════════════════════════════════════════════════════════════
--  MIGRAÇÃO v2 — Resumos, Disciplinas, acesso total do Admin
--  Execute isso no SQL Editor do Supabase se seu projeto JÁ está
--  no ar (rodou o schema.sql antes). É seguro rodar mais de uma
--  vez — todos os comandos são idempotentes.
-- ════════════════════════════════════════════════════════════

-- ── 1) Garante que todas as disciplinas padrão existem ────────
-- (corrige o problema de só existir "Matemática" no cadastro —
--  se você já tiver outras disciplinas com esses nomes, nada é
--  duplicado; e você também pode criar/editar/excluir disciplinas
--  pela nova tela "Disciplinas" no menu Gestão)
insert into public.disciplinas (nome, cor) values
  ('Matemática','#3b82f6'), ('Português','#8b5cf6'), ('História','#f59e0b'),
  ('Biologia','#10b981'), ('Física','#6366f1'), ('Química','#ef4444'),
  ('Geografia','#0ea5e9'), ('Ed. Física','#f97316'), ('Redação','#8b5cf6'),
  ('Ciências','#10b981')
on conflict (nome) do nothing;

-- ── 2) Tabela de Resumos (PDF/DOCX) ────────────────────────────
create table if not exists public.resumos (
  id uuid default uuid_generate_v4() primary key,
  titulo text not null,
  descricao text,
  disciplina text references public.disciplinas(nome),
  professor_id uuid references public.profiles(id),
  turmas text[] not null default '{}',
  tipo_arquivo text,
  arquivo_url text,
  tamanho_kb int,
  created_at timestamptz default now()
);

alter table public.resumos enable row level security;

drop policy if exists "Resumos visíveis conforme turma" on public.resumos;
create policy "Resumos visíveis conforme turma"
  on public.resumos for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and (p.tipo in ('professor','admin') or p.turma = any(resumos.turmas) or 'todas' = any(resumos.turmas))
    )
  );

drop policy if exists "Professor/Admin gerencia resumos" on public.resumos;
create policy "Professor/Admin gerencia resumos"
  on public.resumos for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin')));

-- ── 3) Storage bucket para os arquivos de Resumos ──────────────
insert into storage.buckets (id, name, public)
values ('resumos', 'resumos', true)
on conflict (id) do nothing;

drop policy if exists "Leitura pública de resumos" on storage.objects;
create policy "Leitura pública de resumos"
  on storage.objects for select
  using (bucket_id = 'resumos');

drop policy if exists "Professor/Admin envia resumos" on storage.objects;
create policy "Professor/Admin envia resumos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resumos'
    and exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin'))
  );

drop policy if exists "Professor/Admin remove resumos" on storage.objects;
create policy "Professor/Admin remove resumos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'resumos'
    and exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin'))
  );

-- ── 4) Admin passa a ter acesso total a Perfis e Entregas ──────
-- (antes, o admin só podia editar o próprio perfil na tabela
--  profiles, e não tinha permissão nenhuma sobre entregas)
drop policy if exists "Admin gerencia qualquer perfil" on public.profiles;
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
create policy "Admin gerencia qualquer perfil"
  on public.profiles for all
  to authenticated
  using (public.is_admin());

drop policy if exists "Professor/Admin gerencia entregas" on public.entregas;
create policy "Professor/Admin gerencia entregas"
  on public.entregas for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin')));

-- ════════════════════════════════════════════════════════════
--  PRONTO! Depois de rodar este script:
--  1. Vá em Gestão → Disciplinas e cadastre/edite o que precisar.
--  2. A aba "Resumos" já aparece no menu para todo mundo.
--  3. Alunos que sumiam em Usuários agora aparecem (correção já
--     está no código do app/api/usuarios/route.ts, sem precisar
--     de SQL para isso).
-- ════════════════════════════════════════════════════════════
