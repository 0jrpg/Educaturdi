export type Tipo = 'aluno' | 'professor' | 'admin';
export type StatusEntrega = 'pendente' | 'entregue' | 'atrasado' | 'recusada';
export type Prioridade = 'alta' | 'normal' | 'baixa';
export type Grau = 'importante' | 'normal' | 'opcional';

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

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  disciplina: string;
  professor_id: string | null;
  turmas: string[];
  prazo: string;
  pontos: number;
  grau: Grau;
  created_at: string;
  // joined
  status?: StatusEntrega;
  professorNome?: string | null;
}

export interface Entrega {
  id: string;
  tarefa_id: string;
  aluno_id: string;
  status: StatusEntrega;
  resposta: string | null;
  arquivo_url: string | null;
  nota_obtida: number | null;
  motivo_recusa: string | null;
  entregue_em: string | null;
  visto_em: string | null;
}

export interface Trabalho {
  id: string;
  titulo: string;
  descricao: string | null;
  disciplina: string;
  professor_id: string | null;
  turmas: string[];
  prazo: string;
  pontos: number;
  grau: Grau;
  created_at: string;
  status?: StatusEntrega;
  professorNome?: string | null;
}

export interface EntregaTrabalho {
  id: string;
  trabalho_id: string;
  aluno_id: string;
  status: StatusEntrega;
  resposta: string | null;
  arquivo_url: string | null;
  nota_obtida: number | null;
  motivo_recusa: string | null;
  entregue_em: string | null;
  visto_em: string | null;
}

export interface Ficha {
  id: string;
  aluno_id: string;
  motivo: string;
  autor_id: string | null;
  origem: string;
  created_at: string;
  autorNome?: string | null;
}

export interface Prova {
  id: string;
  titulo: string;
  descricao: string | null;
  disciplina: string;
  professor_id: string | null;
  turmas: string[];
  duracao_minutos: number;
  pontos: number;
  disponivel_de: string;
  disponivel_ate: string | null;
  created_at: string;
}

export interface ProvaTentativa {
  id: string;
  prova_id: string;
  aluno_id: string;
  iniciada_em: string;
  termina_em: string;
  finalizada_em: string | null;
  penalidades: number;
  resposta: string | null;
  arquivo_url: string | null;
  nota_obtida: number | null;
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

export interface Resumo {
  id: string;
  titulo: string;
  descricao: string | null;
  disciplina: string;
  professor_id: string | null;
  turmas: string[];
  tipo_arquivo: string | null;
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
