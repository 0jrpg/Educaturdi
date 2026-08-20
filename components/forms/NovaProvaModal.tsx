'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import { criarNotificacao } from '@/lib/notificacoes';
import Modal from '@/components/Modal';
import type { Disciplina, Turma } from '@/types/database';

export default function NovaProvaModal({
  open, onClose, disciplinas, turmas, professorId,
}: { open: boolean; onClose: () => void; disciplinas: Disciplina[]; turmas: Turma[]; professorId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [disciplina, setDisciplina] = useState(disciplinas[0]?.nome ?? '');
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<string[]>([]);
  const [duracao, setDuracao] = useState(45);
  const [pontos, setPontos] = useState(10);
  const [disponivelAte, setDisponivelAte] = useState('');
  const [salvando, setSalvando] = useState(false);

  function toggleTurma(id: string) {
    setTurmasSelecionadas((cur) => cur.includes(id) ? cur.filter(t => t !== id) : [...cur, id]);
  }

  async function salvar() {
    if (!titulo.trim()) return showToast('Dê um título.', 'error');
    if (!turmasSelecionadas.length) return showToast('Selecione ao menos uma turma.', 'error');
    if (duracao < 5) return showToast('A duração mínima é de 5 minutos.', 'error');

    setSalvando(true);
    const { error } = await supabase.from('provas').insert({
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      disciplina,
      professor_id: professorId,
      turmas: turmasSelecionadas,
      duracao_minutos: duracao,
      pontos,
      disponivel_de: new Date().toISOString(),
      disponivel_ate: disponivelAte ? new Date(`${disponivelAte}T23:59:59`).toISOString() : null,
    });

    if (error) {
      setSalvando(false);
      return showToast('Erro ao criar prova: ' + error.message, 'error');
    }

    await criarNotificacao(supabase, {
      tipo: 'prova',
      titulo: `Nova prova: ${titulo.trim()}`,
      descricao: `${disciplina} · ${duracao} min`,
      turmas: turmasSelecionadas,
      autorId: professorId,
    });

    setSalvando(false);
    showToast('Prova criada com sucesso!', 'success');
    setTitulo(''); setDescricao(''); setTurmasSelecionadas([]); setDuracao(45); setPontos(10); setDisponivelAte('');
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova Prova"
      footer={<><button className="btn btn-primary" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Criar Prova'}</button><button className="btn btn-outline" onClick={onClose}>Cancelar</button></>}
    >
      <div className="fg">
        <label className="flabel">Título</label>
        <input className="finput" placeholder="Ex: Prova bimestral — Equações" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <div className="fg">
        <label className="flabel">Enunciado / Instruções</label>
        <textarea className="finput" style={{ minHeight: 100 }} placeholder="O que o aluno deve responder…" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="form-grid-2">
        <div className="fg">
          <label className="flabel">Disciplina</label>
          <select className="finput" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
            {disciplinas.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
          </select>
        </div>
        <div className="fg">
          <label className="flabel">Valor (pontos)</label>
          <input type="number" className="finput" min={0.1} step={0.1} value={pontos} onChange={(e) => setPontos(Number(e.target.value))} />
        </div>
      </div>
      <div className="form-grid-2">
        <div className="fg">
          <label className="flabel">Duração (minutos)</label>
          <input type="number" className="finput" min={5} step={5} value={duracao} onChange={(e) => setDuracao(Number(e.target.value))} />
        </div>
        <div className="fg">
          <label className="flabel">Disponível até <span style={{ color: 'var(--s400)', fontWeight: 400 }}>(opcional)</span></label>
          <input type="date" className="finput" value={disponivelAte} onChange={(e) => setDisponivelAte(e.target.value)} />
        </div>
      </div>

      <div style={{ background: 'var(--am50)', border: '1px solid var(--am100)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--am700)', marginBottom: '1.1rem' }}>
        Assim que o aluno clicar em &quot;Iniciar Prova&quot;, o cronômetro começa e não pode ser pausado. Sair da aba ou navegar
        pra outra página do site desconta 5 minutos automaticamente.
      </div>

      <div className="fg" style={{ marginBottom: 0 }}>
        <label className="flabel">Turmas</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {turmas.map((t) => (
            <button type="button" key={t.id} onClick={() => toggleTurma(t.id)} className="badge"
              style={{ cursor: 'pointer', padding: '6px 14px', fontSize: 13, background: turmasSelecionadas.includes(t.id) ? 'var(--g500)' : 'var(--s100)', color: turmasSelecionadas.includes(t.id) ? '#fff' : 'var(--s600)' }}>
              {t.id}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
