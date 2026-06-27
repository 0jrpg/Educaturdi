# 🎓 EducaTurdi — Plataforma Escolar (Next.js + Supabase)

Site escolar fictício, sem fins comerciais — feito só por diversão.

## Stack
- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Auth + Postgres + Row Level Security)
- **Vercel** (hospedagem)

---

## 1. Configurar o banco no Supabase

1. Acesse seu projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor → New Query**.
3. Cole todo o conteúdo do arquivo `supabase/schema.sql` e clique em **Run**.
   - Isso cria todas as tabelas, políticas de segurança (RLS) e alguns dados iniciais (turmas e disciplinas).

## 2. Criar os usuários (login)

Como você escolheu usar o **Supabase Auth**, os usuários são criados pelo painel, não por um arquivo `.txt`:

1. Vá em **Authentication → Users → Add user → Create new user**.
2. Preencha e-mail e senha.
3. Em **"User Metadata"**, adicione um JSON assim:

```json
{ "nome": "Ana Turdi", "tipo": "aluno", "turma": "3B" }
```

   - `tipo` pode ser `aluno`, `professor` ou `admin`.
   - `turma` só é necessária para alunos (use o código, ex: `3B`).

4. Repita para cada usuário (admin, professores, alunos).
5. Um gatilho (trigger) já configurado no `schema.sql` cria automaticamente o perfil na tabela `profiles`.

> 💡 Dica: crie pelo menos 1 admin, 1 professor e 2-3 alunos de turmas diferentes para testar tudo.

## 3. Adicionar dados de exemplo (opcional, mas recomendado)

Depois de criar os usuários, vá em **Table Editor** e adicione manualmente (ou via SQL):
- **`atividades`** — tarefas escolares
- **`apostilas`** — materiais em PDF
- **`notas`** — notas dos alunos (use o UUID do aluno, visível em Authentication → Users)
- **`comunicados`** — avisos da escola
- **`horarios`** — grade horária por turma

Veja exemplos de como preencher cada campo no próprio `schema.sql` (seção de comentários).

## 4. Rodar localmente

```bash
npm install
cp .env.local.example .env.local
```

Edite `.env.local` e cole sua **Project URL** e **anon key** (em Supabase → Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

Depois:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## 5. Subir pro GitHub

```bash
git init
git add .
git commit -m "EducaTurdi - versão inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/educaturdi.git
git push -u origin main
```

⚠️ **O arquivo `.env.local` está no `.gitignore` e NUNCA deve ser commitado.** Suas chaves do Supabase ficam apenas no seu computador e na Vercel.

## 6. Hospedar na Vercel

1. Acesse [vercel.com](https://vercel.com) → **New Project** → importe seu repositório do GitHub.
2. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Clique em **Deploy**.

Pronto! Seu site estará no ar em `https://seu-projeto.vercel.app`.

---

## Estrutura do projeto

```
app/
  login/              → página de login (Supabase Auth)
  auth/callback/       → rota de callback do Supabase Auth
  (app)/                → grupo de rotas protegidas (exige login)
    dashboard/
    atividades/
    apostilas/
    notas/
    comunicados/
    horario/
    turmas/             → só professor/admin
    usuarios/           → só admin
    perfil/
  layout.tsx            → layout raiz
  globals.css           → tema visual (verde)
components/
  AppShell.tsx           → sidebar + topbar
  Badge.tsx
  Toast.tsx
lib/supabase/
  client.ts              → cliente Supabase (browser)
  server.ts              → cliente Supabase (servidor)
middleware.ts             → protege rotas e atualiza sessão
supabase/schema.sql        → schema completo do banco (rode isso primeiro!)
types/database.ts          → tipos TypeScript das tabelas
```

## Segurança (RLS)

Todas as tabelas têm **Row Level Security** ativado:
- Alunos só veem atividades/apostilas/notas/horários da própria turma.
- Professores e admins veem tudo.
- Só admin gerencia usuários e turmas.
- Cada aluno só edita a própria entrega de atividade e a própria senha.

## Próximos passos sugeridos (não inclusos)

- **Upload real de PDF**: usar o Supabase Storage (criar um bucket `apostilas` e salvar a URL pública em `apostilas.arquivo_url`).
- **Criação de atividades/comunicados pela interface**: hoje isso é feito pelo Table Editor do Supabase; dá pra criar formulários no site também.
- **Recuperação de senha**: o Supabase Auth já suporta `resetPasswordForEmail()` — é só adicionar uma tela para isso.
