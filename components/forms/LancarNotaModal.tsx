'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import type { Disciplina, Profile } from '@/types/database';

export default function LancarNotaModal({
  open, onClose, disciplinas, turmas,
}: { open: boolean; onClose: () => void; disciplinas: Disciplina[]; turmas: string[] }) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [turma, setTurma] = useState(turmas[0] ?? '');
  const [disciplina, setDisciplina] = useState(disciplinas[0]?.nome ?? '');
  const [professor, setProfessor] = useState('');
  const [alunos, setAlunos] = useState<Profile[]>([]);
  const [notas, setNotas] = useState<Record<string, { b1: string; b2: string; b3: string; b4: string }>>({});
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    carregarAlunosENotas();
  }, [open, turma, disciplina]);

  async function carregarAlunosENotas() {
    if (!turma || !disciplina) return;
    setCarregando(true);

    const { data: alunosData } = await supabase.from('profiles').select('*').eq('tipo', 'aluno').eq('turma', turma).order('nome');
    const listaAlunos = (alunosData as Profile[] | null) ?? [];
    setAlunos(listaAlunos);

    if (listaAlunos.length) {
      const { data: notasData } = await supabase
        .from('notas').select('*')
        .eq('disciplina', disciplina)
        .in('aluno_id', listaAlunos.map(a => a.id));

      const map: Record<string, { b1: string; b2: string; b3: string; b4: string }> = {};
      for (const a of listaAlunos) {
        const n = (notasData ?? []).find((x: any) => x.aluno_id === a.id);
        map[a.id] = {
          b1: n?.b1?.toString() ?? '',
          b2: n?.b2?.toString() ?? '',
          b3: n?.b3?.toString() ?? '',
          b4: n?.b4?.toString() ?? '',
        };
      }
      setNotas(map);
    }
    setCarregando(false);
  }

  function atualizarNota(alunoId: string, bim: 'b1' | 'b2' | 'b3' | 'b4', valor: string) {
    setNotas((cur) => ({ ...cur, [alunoId]: { ...cur[alunoId], [bim]: valor } }));
  }

  async function salvarTudo() {
    setSalvando(true);
    try {
      const linhas = alunos.map((a) => {
        const n = notas[a.id] ?? { b1: '', b2: '', b3: '', b4: '' };
        return {
          aluno_id: a.id,
          disciplina,
          professor: professor || null,
          b1: n.b1 === '' ? null : Number(n.b1),
          b2: n.b2 === '' ? null : Number(n.b2),
          b3: n.b3 === '' ? null : Number(n.b3),
          b4: n.b4 === '' ? null : Number(n.b4),
        };
      });

      const { error } = await supabase.from('notas').upsert(linhas, { onConflict: 'aluno_id,disciplina' });
      if (error) throw new Error(error.message);

      showToast('Notas salvas com sucesso!', 'success');
      onClose();
      router.refresh();
    } catch (e: any) {
      showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lançar Notas"
      maxWidth={680}
      footer={
        <>
          <button className="btn btn-primary" disabled={salvando || carregando} onClick={salvarTudo}>
            {salvando ? 'Salvando...' : 'Salvar Notas'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: '1.2rem' }}>
        <div className="fg" style={{ marginBottom: 0 }}>
          <label className="flabel">Turma</label>
          <select className="finput" value={turma} onChange={(e) => setTurma(e.target.value)}>
            {turmas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="fg" style={{ marginBottom: 0 }}>
          <label className="flabel">Disciplina</label>
          <select className="finput" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
            {disciplinas.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
          </select>
        </div>
        <div className="fg" style={{ marginBottom: 0 }}>
          <label className="flabel">Professor</label>
          <input className="finput" placeholder="Prof. ..." value={professor} onChange={(e) => setProfessor(e.target.value)} />
        </div>
      </div>

      {carregando ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : alunos.length === 0 ? (
        <div className="empty-state"><h3>Nenhum aluno nesta turma</h3></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Aluno</th><th>1º Bim</th><th>2º Bim</th><th>3º Bim</th><th>4º Bim</th></tr></thead>
            <tbody>
              {alunos.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{a.nome}</td>
                  {(['b1', 'b2', 'b3', 'b4'] as const).map((bim) => (
                    <td key={bim}>
                      <input
                        type="number" min={0} max={10} step={0.1}
                        className="finput" style={{ width: 64, padding: '6px 8px', textAlign: 'center' }}
                        value={notas[a.id]?.[bim] ?? ''}
                        onChange={(e) => atualizarNota(a.id, bim, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
