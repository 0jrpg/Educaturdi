-- ════════════════════════════════════════════════════════════
--  EDUCATURDI — SCHEMA SUPABASE
--  Execute este arquivo completo em: Supabase Dashboard
--  → SQL Editor → New Query → cole tudo → Run
-- ════════════════════════════════════════════════════════════

-- ── EXTENSÕES ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ════════════════════════════════════════════════════════════
--  TABELA: profiles
--  Estende auth.users com dados da escola (tipo, turma, nome)
-- ════════════════════════════════════════════════════════════
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  tipo text not null check (tipo in ('aluno','professor','admin')),
  turma text, -- null para professor/admin
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Todo usuário autenticado pode ler perfis (necessário pra exibir nomes de professores etc)
create policy "Perfis são visíveis para usuários autenticados"
  on public.profiles for select
  to authenticated
  using (true);

-- Usuário só edita o próprio perfil
create policy "Usuários atualizam o próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- ── TRIGGER: cria profile automaticamente ao registrar ──────
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, tipo, turma)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    coalesce(new.raw_user_meta_data->>'tipo', 'aluno'),
    new.raw_user_meta_data->>'turma'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ════════════════════════════════════════════════════════════
--  TABELA: turmas
-- ════════════════════════════════════════════════════════════
create table public.turmas (
  id text primary key,           -- ex: '3B'
  nome text not null,            -- ex: '3º Ano B'
  nivel text not null,
  periodo text not null,
  sala text,
  responsavel text,
  created_at timestamptz default now()
);

alter table public.turmas enable row level security;

create policy "Turmas visíveis para autenticados"
  on public.turmas for select to authenticated using (true);

create policy "Admin gerencia turmas"
  on public.turmas for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and tipo = 'admin'));

-- ════════════════════════════════════════════════════════════
--  TABELA: disciplinas
-- ════════════════════════════════════════════════════════════
create table public.disciplinas (
  id uuid default uuid_generate_v4() primary key,
  nome text not null unique,
  cor text not null default '#64748b'
);

alter table public.disciplinas enable row level security;

create policy "Disciplinas visíveis para autenticados"
  on public.disciplinas for select to authenticated using (true);

create policy "Admin gerencia disciplinas"
  on public.disciplinas for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and tipo = 'admin'));

-- ════════════════════════════════════════════════════════════
--  TABELA: atividades
-- ════════════════════════════════════════════════════════════
create table public.atividades (
  id uuid default uuid_generate_v4() primary key,
  titulo text not null,
  descricao text,
  disciplina text references public.disciplinas(nome),
  professor_id uuid references public.profiles(id),
  turmas text[] not null default '{}',  -- array de códigos de turma
  prazo date not null,
  pontos numeric default 10,
  created_at timestamptz default now()
);

alter table public.atividades enable row level security;

-- Alunos veem só atividades da própria turma; professores/admin veem tudo
create policy "Atividades visíveis conforme turma"
  on public.atividades for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and (p.tipo in ('professor','admin') or p.turma = any(atividades.turmas))
    )
  );

create policy "Professor/Admin cria atividades"
  on public.atividades for insert to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin'))
  );

create policy "Professor/Admin edita atividades"
  on public.atividades for update to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin'))
  );

create policy "Professor/Admin remove atividades"
  on public.atividades for delete to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin'))
  );

-- ════════════════════════════════════════════════════════════
--  TABELA: entregas (status de cada aluno por atividade)
-- ════════════════════════════════════════════════════════════
create table public.entregas (
  id uuid default uuid_generate_v4() primary key,
  atividade_id uuid references public.atividades(id) on delete cascade,
  aluno_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente','entregue','atrasado')),
  entregue_em timestamptz,
  unique(atividade_id, aluno_id)
);

alter table public.entregas enable row level security;

create policy "Aluno vê e edita a própria entrega"
  on public.entregas for select to authenticated
  using (aluno_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin')));

create policy "Aluno atualiza a própria entrega"
  on public.entregas for update to authenticated
  using (aluno_id = auth.uid());

create policy "Aluno cria a própria entrega"
  on public.entregas for insert to authenticated
  with check (aluno_id = auth.uid());

-- ════════════════════════════════════════════════════════════
--  TABELA: apostilas
-- ════════════════════════════════════════════════════════════
create table public.apostilas (
  id uuid default uuid_generate_v4() primary key,
  titulo text not null,
  descricao text,
  disciplina text references public.disciplinas(nome),
  professor_id uuid references public.profiles(id),
  turmas text[] not null default '{}',
  paginas int,
  emoji text default '📄',
  arquivo_url text,  -- URL do Supabase Storage
  tamanho_kb int,
  created_at timestamptz default now()
);

alter table public.apostilas enable row level security;

create policy "Apostilas visíveis conforme turma"
  on public.apostilas for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and (p.tipo in ('professor','admin') or p.turma = any(apostilas.turmas) or 'todas' = any(apostilas.turmas))
    )
  );

create policy "Professor/Admin gerencia apostilas"
  on public.apostilas for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin')));

-- ════════════════════════════════════════════════════════════
--  TABELA: notas
-- ════════════════════════════════════════════════════════════
create table public.notas (
  id uuid default uuid_generate_v4() primary key,
  aluno_id uuid references public.profiles(id) on delete cascade,
  disciplina text references public.disciplinas(nome),
  professor text,
  b1 numeric, b2 numeric, b3 numeric, b4 numeric,
  unique(aluno_id, disciplina)
);

alter table public.notas enable row level security;

create policy "Aluno vê as próprias notas; professor/admin vê tudo"
  on public.notas for select to authenticated
  using (
    aluno_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin'))
  );

create policy "Professor/Admin gerencia notas"
  on public.notas for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin')));

-- ════════════════════════════════════════════════════════════
--  TABELA: comunicados
-- ════════════════════════════════════════════════════════════
create table public.comunicados (
  id uuid default uuid_generate_v4() primary key,
  titulo text not null,
  conteudo text not null,
  categoria text default 'Geral',
  prioridade text default 'normal' check (prioridade in ('alta','normal','baixa')),
  autor_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.comunicados enable row level security;

create policy "Comunicados visíveis para autenticados"
  on public.comunicados for select to authenticated using (true);

create policy "Professor/Admin gerencia comunicados"
  on public.comunicados for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin')));

-- ════════════════════════════════════════════════════════════
--  TABELA: horarios
-- ════════════════════════════════════════════════════════════
create table public.horarios (
  id uuid default uuid_generate_v4() primary key,
  turma text references public.turmas(id),
  dia text not null,          -- 'Segunda', 'Terça', etc.
  hora text not null,         -- '07:30–08:20'
  disciplina text references public.disciplinas(nome),
  professor text,
  sala text,
  ordem int default 0
);

alter table public.horarios enable row level security;

create policy "Horários visíveis para autenticados"
  on public.horarios for select to authenticated using (true);

create policy "Professor/Admin gerencia horários"
  on public.horarios for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and tipo in ('professor','admin')));

-- ════════════════════════════════════════════════════════════
--  SEED — dados de exemplo (disciplinas e turmas)
-- ════════════════════════════════════════════════════════════
insert into public.disciplinas (nome, cor) values
  ('Matemática','#3b82f6'), ('Português','#8b5cf6'), ('História','#f59e0b'),
  ('Biologia','#10b981'), ('Física','#6366f1'), ('Química','#ef4444'),
  ('Geografia','#0ea5e9'), ('Ed. Física','#f97316'), ('Redação','#8b5cf6'),
  ('Ciências','#10b981');

insert into public.turmas (id, nome, nivel, periodo, sala, responsavel) values
  ('3B','3º Ano B','Ensino Médio','Matutino','12','Prof. Carlos Silva'),
  ('2A','2º Ano A','Ensino Médio','Matutino','08','Prof. Roberto Alves'),
  ('1C','1º Ano C','Ensino Médio','Vespertino','05','Prof. Carla Mendes');

-- ════════════════════════════════════════════════════════════
--  PRONTO! Depois de rodar este script:
--  1. Vá em Authentication → Users → Add user (crie os logins)
--  2. Em "User Metadata" ao criar, adicione JSON:
--     {"nome": "Ana Turdi", "tipo": "aluno", "turma": "3B"}
--  3. O trigger criará o profile automaticamente.
-- ════════════════════════════════════════════════════════════
