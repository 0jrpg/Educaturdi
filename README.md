# 🎓 EducaTurdi — Plataforma Escolar (Next.js + Supabase)

Site escolar fictício, sem fins comerciais — feito só por diversão.

## Stack
- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Auth + Postgres + Storage + Row Level Security)
- **Vercel** (hospedagem)

## O que pode ser feito direto pelo site (sem abrir o Supabase)

- ✅ Criar/editar/excluir **usuários** (alunos, professores, admins) — tela de Usuários
- ✅ Criar **atividades** — botão "Nova Atividade"
- ✅ Enviar **apostilas em PDF** (upload real, arrastando o arquivo) — botão "Enviar Apostila"
- ✅ Lançar **notas** por turma/aluno — botão "Lançar Notas"
- ✅ Publicar **comunicados** — botão "Novo Comunicado"
- ✅ Montar a **grade horária** — botão "Adicionar Aula"

O Supabase Dashboard só é necessário para a configuração inicial (rodar o `schema.sql` uma vez).

---

## 1. Configurar o banco no Supabase

1. Acesse seu projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor → New Query**.
3. Cole todo o conteúdo do arquivo `supabase/schema.sql` e clique em **Run**.
   - Isso cria todas as tabelas, políticas de segurança (RLS), o bucket de Storage para PDFs, e dados iniciais (turmas e disciplinas).

> Se você já rodou uma versão antiga do `schema.sql` (sem Storage), rode também `supabase/migration_storage.sql`.

## 2. Pegar suas chaves de API

Vá em **Project Settings → API**. Você vai precisar de três valores:

| Variável | Onde encontrar | Pode aparecer no navegador? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (clique em "Reveal") | **NÃO, NUNCA** |

⚠️ A `service_role key` dá acesso total e irrestrito ao banco, ignorando toda regra de segurança (RLS). Ela só é usada dentro das API Routes do servidor (pasta `app/api/`), nunca em componentes que rodam no navegador. Trate-a como uma senha de administrador.

## 3. Rodar localmente

```bash
npm install
cp .env.local.example .env.local
```

Edite `.env.local` e cole os três valores.

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## 4. Criar o primeiro usuário admin

Como a tela de Usuários só aparece para quem já é admin, o **primeiro** admin precisa ser criado direto no Supabase (só essa vez):

1. **Authentication → Users → Add user**.
2. Preencha e-mail e senha.
3. Em "User Metadata", adicione:
   ```json
   { "nome": "Seu Nome", "tipo": "admin" }
   ```
4. Depois disso, faça login no site com esse usuário — a partir daí, todos os outros usuários (alunos, professores) podem ser criados direto pela tela **Usuários** do EducaTurdi.

## 5. Subir pro GitHub

```bash
git init
git add .
git commit -m "EducaTurdi - versão completa"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/educaturdi.git
git push -u origin main
```

⚠️ **O arquivo `.env.local` está no `.gitignore` e NUNCA deve ser commitado.**

## 6. Hospedar na Vercel

1. [vercel.com](https://vercel.com) → **New Project** → importe seu repositório do GitHub.
2. Em **Environment Variables**, adicione as **três** chaves (incluindo `SUPABASE_SERVICE_ROLE_KEY`, sem o prefixo `NEXT_PUBLIC_`).
3. **Deploy**.

---

## Estrutura do projeto

```
app/
  login/                  → página de login
  auth/callback/           → callback do Supabase Auth
  api/usuarios/             → API routes (criação/edição/exclusão de usuários, usa service_role key)
  (app)/                     → rotas protegidas (exige login)
    dashboard/
    atividades/              → + NovaAtividadeModal
    apostilas/                → + NovaApostilaModal (upload real de PDF)
    notas/                     → + LancarNotaModal
    comunicados/                → + NovoComunicadoModal
    horario/                     → + NovaAulaModal
    turmas/                       → só professor/admin
    usuarios/                      → só admin — CRUD completo de usuários
    perfil/
components/
  forms/                    → modais de criação (atividade, apostila, nota, comunicado, aula)
  AppShell.tsx, Badge.tsx, Modal.tsx, Toast.tsx
lib/supabase/
  client.ts                 → cliente (browser, anon key)
  server.ts                  → cliente (servidor, anon key + RLS)
  admin.ts                    → cliente administrativo (service_role key) — SÓ em API routes
middleware.ts
supabase/schema.sql           → schema completo (rode isso primeiro!)
supabase/migration_storage.sql → migração extra se você já tinha rodado uma versão antiga
types/database.ts
```

## Segurança

- Todas as tabelas têm **Row Level Security** ativado.
- Alunos só veem dados da própria turma; professores/admins veem tudo.
- A criação de usuários passa por uma API Route que verifica, no servidor, se quem está chamando é realmente um admin — antes de usar a service_role key.
- Upload de PDF: o bucket é público para leitura, mas só professor/admin pode enviar ou remover arquivos (verificado via RLS do Storage).

