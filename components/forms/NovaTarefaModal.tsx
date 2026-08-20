'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import { criarNotificacao } from '@/lib/notificacoes';
import Modal from '@/components/Modal';
import { GRAU_LABEL, DIAS_TOLERANCIA } from '@/lib/tarefas';
import type { Disciplina, Turma, Grau } from '@/types/database';

/**
 * Modal de criação compartilhado entre Tarefas e Trabalhos — os dois têm
 * exatamente a mesma mecânica (prazo, grau de importância, entrega com
 * tolerância), só muda a tabela do banco e a faixa de valor em pontos:
 * Tarefa fica entre 0.1 e 2.0 (décimos); Trabalho o professor define livre.
 */
export default function NovaTarefaModal({
  open, onClose, disciplinas, turmas, professorId, modo,
}: {
  open: boolean;
  onClose: () => void;
  disciplinas: Disciplina[];
  turmas: Turma[];
  professorId: string;
  modo: 'tarefa' | 'trabalho';
}) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();
  const tabela = modo === 'tarefa' ? 'tarefas' : 'trabalhos';

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [disciplina, setDisciplina] = useState(disciplinas[0]?.nome ?? '');
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<string[]>([]);
  const [prazo, setPrazo] = useState('');
  const [grau, setGrau] = useState<Grau>('normal');
  const [pontos, setPontos] = useState(modo === 'tarefa' ? 0.5 : 10);
  const [salvando, setSalvando] = useState(false);

  function toggleTurma(id: string) {
    setTurmasSelecionadas((cur) => cur.includes(id) ? cur.filter(t => t !== id) : [...cur, id]);
  }

  function limpar() {
    setTitulo(''); setDescricao(''); setTurmasSelecionadas([]); setPrazo(''); setGrau('normal');
    setPontos(modo === 'tarefa' ? 0.5 : 10);
  }

  async function salvar() {
    if (!titulo.trim()) return showToast('Dê um título.', 'error');
    if (!turmasSelecionadas.length) return showToast('Selecione ao menos uma turma.', 'error');
    if (!prazo) return showToast('Defina um prazo.', 'error');
    if (modo === 'tarefa' && (pontos <= 0 || pontos > 2)) {
      return showToast('Tarefas valem entre 0.1 e 2.0 pontos (décimos).', 'error');
    }

    setSalvando(true);
    const { error } = await supabase.from(tabela).insert({
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      disciplina,
      professor_id: professorId,
      turmas: turmasSelecionadas,
      prazo,
      pontos,
      grau,
    });

    if (error) {
      setSalvando(false);
      showToast(`Erro ao criar ${modo}: ` + error.message, 'error');
      return;
    }

    await criarNotificacao(supabase, {
      tipo: modo === 'tarefa' ? 'tarefa' : 'trabalho',
      titulo: modo === 'tarefa' ? `Nova tarefa: ${titulo.trim()}` : `Novo trabalho: ${titulo.trim()}`,
      descricao: `${disciplina} · Prazo ${new Date(`${prazo}T12:00:00`).toLocaleDateString('pt-BR')}`,
      turmas: turmasSelecionadas,
      autorId: professorId,
    });

    setSalvando(false);
    showToast(`${modo === 'tarefa' ? 'Tarefa criada' : 'Trabalho criado'} com sucesso!`, 'success');
    limpar();
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modo === 'tarefa' ? 'Nova Tarefa' : 'Novo Trabalho'}
      footer={
        <>
          <button className="btn btn-primary" disabled={salvando} onClick={salvar}>
            {salvando ? 'Salvando...' : modo === 'tarefa' ? 'Criar Tarefa' : 'Criar Trabalho'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        </>
      }
    >
      <div className="fg">
        <label className="flabel">Título</label>
        <input className="finput" placeholder={modo === 'tarefa' ? 'Ex: Exercícios de página 42' : 'Ex: Maquete do sistema solar'} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>

      <div className="fg">
        <label className="flabel">Descrição</label>
        <textarea className="finput" placeholder="Detalhes, instruções…" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>

      <div className="form-grid-2">
        <div className="fg">
          <label className="flabel">Disciplina</label>
          <select className="finput" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
            {disciplinas.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
          </select>
        </div>
        <div className="fg">
          <label className="flabel">
            Valor (pontos) {modo === 'tarefa' && <span style={{ color: 'var(--s400)', fontWeight: 400 }}>— décimos, até 2.0</span>}
          </label>
          <input
            type="number" className="finput"
            min={modo === 'tarefa' ? 0.1 : 0.1}
            max={modo === 'tarefa' ? 2 : 100}
            step={0.1}
            value={pontos}
            onChange={(e) => setPontos(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="form-grid-2">
        <div className="fg">
          <label className="flabel">Prazo de entrega</label>
          <input type="date" className="finput" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>
        <div className="fg">
          <label className="flabel">Grau de importância</label>
          <select className="finput" value={grau} onChange={(e) => setGrau(e.target.value as Grau)}>
            {(Object.keys(GRAU_LABEL) as Grau[]).map(g => (
              <option key={g} value={g}>{GRAU_LABEL[g]} — {DIAS_TOLERANCIA[g]} dia(s) de tolerância</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ background: 'var(--g50)', border: '1px solid var(--g100)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--g700)', marginBottom: '1.1rem' }}>
        Depois do prazo, o aluno ainda pode entregar dentro da tolerância do grau escolhido — mas a nota vale <strong>metade</strong>. Passado esse período, a entrega ainda é aceita, porém vale 0 (o professor pode reavaliar manualmente).
      </div>

      <div className="fg" style={{ marginBottom: 0 }}>
        <label className="flabel">Turmas</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {turmas.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => toggleTurma(t.id)}
              className="badge"
              style={{
                cursor: 'pointer', padding: '6px 14px', fontSize: 13,
                background: turmasSelecionadas.includes(t.id) ? 'var(--g500)' : 'var(--s100)',
                color: turmasSelecionadas.includes(t.id) ? '#fff' : 'var(--s600)',
              }}
            >
              {t.id}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
