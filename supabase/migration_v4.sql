-- ════════════════════════════════════════════════════════════
--  MIGRAÇÃO v4 — Alunos respondem atividades de verdade
--  Antes, o aluno só marcava "entregue" (um checkbox). Agora ele
--  escreve a resposta (e pode colar um link de anexo da CDN), e o
--  professor consegue ver o que cada aluno respondeu.
--  Seguro rodar mais de uma vez.
-- ════════════════════════════════════════════════════════════

alter table public.entregas add column if not exists resposta text;
alter table public.entregas add column if not exists arquivo_url text;

-- Força o PostgREST (a API que o app usa) a recarregar o cache do schema
-- agora, em vez de esperar alguns minutos — é isso que resolve o erro
-- "Could not find the 'arquivo_url' column... in the schema cache".
notify pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════
--  PRONTO!
-- ════════════════════════════════════════════════════════════
