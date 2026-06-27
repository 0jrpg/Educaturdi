'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import type { Disciplina } from '@/types/database';

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

export default function NovaAulaModal({
  open, onClose, turmas, disciplinas,
}: { open: boolean; onClose: () => void; turmas: string[]; disciplinas: Disciplina[] }) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [turma, setTurma] = useState(turmas[0] ?? '');
  const [dia, setDia] = useState(DIAS[0]);
  const [hora, setHora] = useState('');
  const [disciplina, setDisciplina] = useState(disciplinas[0]?.nome ?? '');
  const [professor, setProfessor] = useState('');
  const [sala, setSala] = useState('');
  const [ordem, setOrdem] = useState(1);
  const [salvando, setSalvando] = useState(false);

  function limpar() {
    setHora(''); setProfessor(''); setSala(''); setOrdem(1);
  }

  async function salvar() {
    if (!turma || !dia || !hora.trim() || !disciplina) return showToast('Preencha turma, dia, horário e disciplina.', 'error');

    setSalvando(true);
    const { error } = await supabase.from('horarios').insert({
      turma, dia, hora: hora.trim(), disciplina, professor: professor.trim() || null, sala: sala.trim() || null, ordem,
    });
    setSalvando(false);

    if (error) { showToast('Erro ao adicionar aula: ' + error.message, 'error'); return; }

    showToast('Aula adicionada à grade!', 'success');
    limpar();
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adicionar Aula à Grade"
      footer={
        <>
          <button className="btn btn-primary" disabled={salvando} onClick={salvar}>
            {salvando ? 'Salvando...' : 'Adicionar Aula'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="fg">
          <label className="flabel">Turma</label>
          <select className="finput" value={turma} onChange={(e) => setTurma(e.target.value)}>
            {turmas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="fg">
          <label className="flabel">Dia da semana</label>
          <select className="finput" value={dia} onChange={(e) => setDia(e.target.value)}>
            {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="fg">
        <label className="flabel">Horário</label>
        <input className="finput" placeholder="Ex: 07:30–08:20" value={hora} onChange={(e) => setHora(e.target.value)} />
      </div>

      <div className="fg">
        <label className="flabel">Disciplina</label>
        <select className="finput" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
          {disciplinas.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="fg">
          <label className="flabel">Professor</label>
          <input className="finput" placeholder="Prof. ..." value={professor} onChange={(e) => setProfessor(e.target.value)} />
        </div>
        <div className="fg">
          <label className="flabel">Sala</label>
          <input className="finput" placeholder="Ex: 12 ou Lab 1" value={sala} onChange={(e) => setSala(e.target.value)} />
        </div>
      </div>

      <div className="fg" style={{ marginBottom: 0 }}>
        <label className="flabel">Ordem no dia (1ª aula, 2ª aula...)</label>
        <input type="number" className="finput" min={1} max={10} value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} />
      </div>
    </Modal>
  );
}
