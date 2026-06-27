export type Tipo = 'aluno' | 'professor' | 'admin';
export type StatusAtividade = 'pendente' | 'entregue' | 'atrasado';
export type Prioridade = 'alta' | 'normal' | 'baixa';

export interface Profile {
  id: string;
  nome: string;
  tipo: Tipo;
  turma: string | null;
  created_at: string;
}

export interface Turma {
  id: string;
  nome: string;
  nivel: string;
  periodo: string;
  sala: string | null;
  responsavel: string | null;
}

export interface Disciplina {
  id: string;
  nome: string;
  cor: string;
}

export interface Atividade {
  id: string;
  titulo: string;
  descricao: string | null;
  disciplina: string;
  professor_id: string | null;
  turmas: string[];
  prazo: string;
  pontos: number;
  created_at: string;
  // joined
  status?: StatusAtividade;
}

export interface Entrega {
  id: string;
  atividade_id: string;
  aluno_id: string;
  status: StatusAtividade;
  entregue_em: string | null;
}

export interface Apostila {
  id: string;
  titulo: string;
  descricao: string | null;
  disciplina: string;
  professor_id: string | null;
  turmas: string[];
  paginas: number | null;
  emoji: string;
  arquivo_url: string | null;
  tamanho_kb: number | null;
  created_at: string;
}

export interface Nota {
  id: string;
  aluno_id: string;
  disciplina: string;
  professor: string | null;
  b1: number | null;
  b2: number | null;
  b3: number | null;
  b4: number | null;
}

export interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: string;
  prioridade: Prioridade;
  autor_id: string | null;
  created_at: string;
}

export interface Horario {
  id: string;
  turma: string;
  dia: string;
  hora: string;
  disciplina: string;
  professor: string | null;
  sala: string | null;
  ordem: number;
}
