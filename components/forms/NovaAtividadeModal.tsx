'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import type { Disciplina, Turma } from '@/types/database';

export default function NovaAtividadeModal({
  open, onClose, disciplinas, turmas, professorId,
}: {
  open: boolean;
  onClose: () => void;
  disciplinas: Disciplina[];
  turmas: Turma[];
  professorId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [disciplina, setDisciplina] = useState(disciplinas[0]?.nome ?? '');
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<string[]>([]);
  const [prazo, setPrazo] = useState('');
  const [pontos, setPontos] = useState(10);
  const [salvando, setSalvando] = useState(false);

  function toggleTurma(id: string) {
    setTurmasSelecionadas((cur) => cur.includes(id) ? cur.filter(t => t !== id) : [...cur, id]);
  }

  function limpar() {
    setTitulo(''); setDescricao(''); setTurmasSelecionadas([]); setPrazo(''); setPontos(10);
  }

  async function salvar() {
    if (!titulo.trim()) { showToast('Dê um título para a atividade.', 'error'); return; }
    if (!turmasSelecionadas.length) { showToast('Selecione ao menos uma turma.', 'error'); return; }
    if (!prazo) { showToast('Defina um prazo.', 'error'); return; }

    setSalvando(true);
    const { error } = await supabase.from('atividades').insert({
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      disciplina,
      professor_id: professorId,
      turmas: turmasSelecionadas,
      prazo,
      pontos,
    });
    setSalvando(false);

    if (error) { showToast('Erro ao criar atividade: ' + error.message, 'error'); return; }

    showToast('Atividade criada com sucesso!', 'success');
    limpar();
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova Atividade"
      footer={
        <>
          <button className="btn btn-primary" disabled={salvando} onClick={salvar}>
            {salvando ? 'Salvando...' : 'Criar Atividade'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        </>
      }
    >
      <div className="fg">
        <label className="flabel">Título</label>
        <input className="finput" placeholder="Ex: Redação sobre meio ambiente" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>

      <div className="fg">
        <label className="flabel">Descrição</label>
        <textarea className="finput" placeholder="Detalhes da atividade…" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="fg">
          <label className="flabel">Disciplina</label>
          <select className="finput" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
            {disciplinas.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
          </select>
        </div>
        <div className="fg">
          <label className="flabel">Pontos</label>
          <input type="number" className="finput" min={0} max={100} value={pontos} onChange={(e) => setPontos(Number(e.target.value))} />
        </div>
      </div>

      <div className="fg">
        <label className="flabel">Prazo de entrega</label>
        <input type="date" className="finput" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
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
