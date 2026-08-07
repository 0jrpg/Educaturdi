-- ════════════════════════════════════════════════════════════
--  MIGRAÇÃO v5 — Anexo de imagem do aluno nas respostas (7 dias)
--  Alunos não têm acesso à CDN da escola, então pra anexar algo na
--  resposta de uma atividade eles enviam uma FOTO direto pro Storage
--  da Supabase. Essas imagens são apagadas automaticamente depois de
--  7 dias (um job agendado cuida disso sozinho).
--  Seguro rodar mais de uma vez.
-- ════════════════════════════════════════════════════════════

-- Bucket público (assim como apostilas/resumos) só pra anexos de aluno
insert into storage.buckets (id, name, public)
values ('entregas-anexos', 'entregas-anexos', true)
on conflict (id) do nothing;

-- Leitura pública (professor/admin e o próprio aluno enxergam a imagem)
drop policy if exists "Leitura pública de anexos de entrega" on storage.objects;
create policy "Leitura pública de anexos de entrega"
  on storage.objects for select
  using (bucket_id = 'entregas-anexos');

-- Aluno só pode enviar dentro da própria "pasta" (nome do arquivo
-- precisa começar com o próprio id de usuário) — assim um aluno não
-- consegue sobrescrever o anexo de outro.
drop policy if exists "Aluno envia o próprio anexo" on storage.objects;
create policy "Aluno envia o próprio anexo"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'entregas-anexos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Professor/admin podem remover qualquer anexo (moderação)
drop policy if exists "Professor/Admin remove anexos de entrega" on storage.objects;
create policy "Professor/Admin remove anexos de entrega"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'entregas-anexos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin'))
    )
  );

-- ── Limpeza automática após 7 dias ─────────────────────────────
-- Função que apaga (com privilégio elevado, ignorando RLS) qualquer
-- arquivo desse bucket com mais de 7 dias.
create or replace function public.limpar_anexos_entregas_antigos()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects
  where bucket_id = 'entregas-anexos'
    and created_at < now() - interval '7 days';
end;
$$;

-- Agenda a função pra rodar todo dia às 3h da manhã.
-- Precisa da extensão pg_cron ativada no projeto (Database → Extensions
-- → pg_cron, ou rode "create extension if not exists pg_cron;" antes).
create extension if not exists pg_cron;

select cron.unschedule(jobid) from cron.job where jobname = 'limpar-anexos-entregas-diario';

select cron.schedule(
  'limpar-anexos-entregas-diario',
  '0 3 * * *',
  $$ select public.limpar_anexos_entregas_antigos(); $$
);

notify pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════
--  PRONTO! Se o "create extension pg_cron" der erro de permissão,
--  vá em Database → Extensions no painel do Supabase, procure
--  "pg_cron", ative por lá, e rode esse arquivo de novo.
-- ════════════════════════════════════════════════════════════
