<div align="center">

# 🎓 EducaTurdi

### Uma plataforma escolar completa, construída do zero — login real, banco de dados, presença em tempo real e tudo o mais que um sistema de escola de verdade precisa.

**Next.js 14 · Supabase (Auth + Postgres + Storage + Realtime) · TypeScript**

</div>

<br />

## O que é isso

O **EducaTurdi** é uma plataforma escolar fictícia, com o visual e o comportamento de um sistema profissional (tipo Plurall, SEEB, etc.), mas construída como projeto pessoal, do zero, com autenticação real, banco de dados real e deploy real. Não é uma maquete — é um sistema funcional, com três papéis de usuário (aluno, professor, administrador), cada um vendo e podendo fazer coisas diferentes, com permissões de verdade aplicadas no banco de dados (Row Level Security), não só escondidas na tela.

Tudo pode ser gerenciado direto pelo site — criar turmas, lançar notas, publicar atividades, subir apostilas — sem precisar abrir o painel do Supabase no dia a dia.

<br />

## ✨ Funcionalidades

### 🔐 Login e contas
Autenticação de verdade via Supabase Auth (e-mail + senha, sessão persistente, troca de senha). Três tipos de conta com permissões distintas:

| | Aluno | Professor | Admin |
|---|:---:|:---:|:---:|
| Ver tarefas, trabalhos, provas, apostilas, resumos e notas da própria turma | ✅ | ✅ | ✅ |
| Responder tarefas, trabalhos e provas | ✅ | — | — |
| Criar tarefas, trabalhos, provas, apostilas, resumos, comunicados e horários | — | ✅ | ✅ |
| Lançar notas · aceitar/recusar entregas · emitir fichas | — | ✅ | ✅ |
| Criar/editar/excluir turmas e disciplinas | — | ✅ | ✅ |
| Criar/editar/excluir usuários | — | — | ✅ |

### 📋 Tarefas
Valem, cada uma, entre 0,1 e 2,0 pontos (décimos). Cada tarefa tem um **grau de importância** — Importante, Normal ou Opcional — que define quantos dias de tolerância o aluno tem depois do prazo (2 ou 1 dia); entregar dentro dessa tolerância vale **metade** da nota. O aluno responde direto pela plataforma — texto e/ou uma foto anexada — e pode reenviar. O professor acompanha, tarefa por tarefa, quem já **abriu**, quem **respondeu**, quem está **atrasado** — e pode **recusar** uma entrega malfeita, com um motivo, reabrindo pra uma segunda chance.

### 💼 Trabalhos
Mesma mecânica das tarefas (prazo, grau, tolerância, aceitar/recusar), mas com valor livre — o professor decide quantos pontos vale, sem o limite de 2,0. Pra trabalhos que pesam mais na média.

### ⏱️ Provas
Prova cronometrada de verdade: o aluno clica em "Iniciar" e o relógio (45 minutos por padrão, configurável) começa a contar a partir do servidor — não dá pra pausar. Se o aluno trocar de aba, minimizar o navegador ou tentar navegar pra qualquer outra página do site enquanto a prova está rodando, ele é **trazido de volta automaticamente** e leva um desconto de 5 minutos. A resposta é salva sozinha a cada poucos segundos, então nada se perde se o tempo acabar.

### 🚩 Fichas
Registro de advertências de comportamento. Professor ou admin emite uma ficha pra um aluno com um motivo — inclusive direto de dentro de uma tarefa recusada, quando o aluno não aproveita a segunda chance. A partir de **3 fichas**, o sistema sinaliza visualmente que o responsável precisa ser chamado.

### 🔔 Notificações
Sino no topo com contador de não lidas: dispara automaticamente quando alguém publica uma apostila, um comunicado, ou lança notas — em tempo real, sem precisar recarregar a página. Passar o mouse no nome do usuário abre um menu com acesso rápido ao perfil e ao logout.

### 📚 Apostilas & 📝 Resumos
Duas bibliotecas de material — apostilas (conteúdo oficial da disciplina) e resumos (material de apoio, enviado por professores ou pelos próprios alunos). Os arquivos não ficam soltos: um **visualizador de documentos próprio**, com a marca da plataforma, abre PDFs e arquivos do Office (Word, PowerPoint, Excel) sem sair do site — com zoom, impressão, download e **modo tela cheia** (usando a API nativa de fullscreen do navegador, some até a barra de endereço).

Os arquivos podem vir de duas formas: upload direto (guardado no Supabase Storage) ou um link de CDN própria — o campo já vem pré-preenchido com o domínio, bastando colar o código do arquivo.

### 📊 Notas
Boletim por bimestre (1º ao 4º), por turma e por disciplina, com lançamento em lote — o professor abre uma turma, escolhe a disciplina, e preenche a nota de todos os alunos numa tabela só. Cálculo automático de média e situação (aprovado / recuperação / reprovado).

### 📢 Comunicados
Mural de avisos categorizado (Acadêmico, Evento, Saúde, Sistema...) com nível de prioridade, visível pra toda a escola.

### 🗓️ Horário
Grade horária por turma, com o dia atual destacado automaticamente.

### 👥 Turmas & Usuários
CRUD completo de turmas e de usuários (aluno, professor, admin) direto pela interface — criar, editar, redefinir senha e excluir, sem precisar abrir o Supabase. A criação de usuário roda numa API Route protegida no servidor, que verifica a permissão antes de tocar no banco.

### 🟢 Presença em tempo real
Cada usuário tem um status ao vivo, calculado a partir da última atividade (sem depender de um evento de "desconectou", que não é confiável no navegador):

- 🟢 **Online agora** — ativo nos últimos 60 segundos
- 🟡 **Ausente** — sem atividade entre 1 e 5 minutos
- ⚪ **Offline** — com "visto por último há X"

E não é só "online/offline": o sistema mostra **o que a pessoa está fazendo agora** — "Lendo apostila: Matemática Vol. 1", "Respondendo: Redação sobre sustentabilidade", "Fazendo a prova: ..." — atualizado ao vivo via Supabase Realtime, visível nas telas de Usuários, Turmas (com contador "X online" por turma) e dentro de cada Tarefa/Trabalho.

### 🖥️ Interface
Sistema visual próprio, com gradientes, glow e microanimação em praticamente todo componente: cards que sobem levemente ao passar o mouse, listas com entrada escalonada, menu lateral com itens entrando em cascata, abas com sublinhado animado, botões com brilho, badges de destaque, avatares que reagem ao toque. O logotipo "EducaTurdi" usa uma fonte própria (Space Grotesk), diferente do resto do texto.

Menu lateral verde com **modo retrátil** exclusivo pra desktop: um clique fixa ou oculta o menu; quando oculto, basta encostar o mouse na borda esquerda da tela pra ele reaparecer por cima do conteúdo, e afastar o mouse esconde de novo — a preferência fica salva no navegador.

Cada seção tem seu **próprio ícone de aba do navegador**: o capelo de formatura na maioria das páginas, um livro em Apostilas, uma prancheta com check em Tarefas, uma maleta em Trabalhos, um cronômetro em Provas, e assim por diante — e a tela de login usa o logotipo "EDU/TRD" em degradê.

<br />

## 🏗️ Como foi construído

```
Next.js 14 (App Router, TypeScript)  →  frontend + backend (API Routes)
Supabase                             →  autenticação, banco Postgres, arquivos, tempo real
Vercel                               →  hospedagem
```

**Banco de dados** — treze tabelas (`profiles`, `turmas`, `disciplinas`, `atividades`, `entregas`, `apostilas`, `resumos`, `notas`, `comunicados`, `horarios`, `presence`, entre outras), todas com **Row Level Security** ativado: um aluno literalmente não consegue ler, via requisição direta ao banco, a nota de outro aluno — a regra está no Postgres, não só escondida na interface.

**Autenticação** — Supabase Auth com sessão via cookies (SSR), middleware que protege todas as rotas internas, e uma segunda chave (service role), usada só em API Routes do servidor, nunca exposta ao navegador, pra permitir que administradores criem contas de outros usuários.

**Tempo real** — a tabela de presença usa Supabase Realtime: mudanças de status chegam via WebSocket pra quem está com a tela de Usuários/Turmas/Atividades aberta, sem polling.

**Arquivos** — Supabase Storage para upload direto, com política de acesso (quem pode subir, quem pode ver) também aplicada via RLS; alternativamente, qualquer link de CDN externa.

<br />

## 📂 Estrutura

```
app/
  login/                    página de login
  (app)/                    tudo que exige estar logado
    dashboard/  atividades/  apostilas/  resumos/
    notas/  comunicados/  horario/
    turmas/  disciplinas/  usuarios/     ← gestão (professor/admin)
    perfil/
  api/usuarios/              criação e edição de contas (server-side)
components/
  AppShell                   menu lateral + topo
  DocumentViewer             visualizador de PDF/Office com tela cheia
  PresenceProvider           heartbeat de presença
  StatusDot                  bolinha de status online/ausente/offline
  forms/                     modais de criação (atividade, apostila, resumo, nota, aula, comunicado)
lib/
  supabase/                  clientes (browser, servidor, admin)
  presence.ts                cálculo de status a partir do último acesso
supabase/
  schema.sql + migrations    schema completo do banco
```

<br />

<div align="center">

---

Projeto pessoal — créditos a **SprokTurdi**

</div>
