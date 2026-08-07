-- ════════════════════════════════════════════════════════════
--  MIGRAÇÃO — adicionar upload de PDFs (Storage)
--  Execute isso se você JÁ rodou o schema.sql antes.
--  Se está rodando schema.sql do zero agora, pode ignorar este
--  arquivo (ele já está incluso no schema.sql atualizado).
-- ════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('apostilas', 'apostilas', true)
on conflict (id) do nothing;

create policy "Leitura pública de apostilas"
  on storage.objects for select
  using (bucket_id = 'apostilas');

create policy "Professor/Admin envia apostilas"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'apostilas'
    and exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin'))
  );

create policy "Professor/Admin remove apostilas"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'apostilas'
    and exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin'))
  );
