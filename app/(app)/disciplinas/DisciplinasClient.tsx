'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconTrash, IconPencil } from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import type { Disciplina } from '@/types/database';

const CORES_SUGERIDAS = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#6366f1',
  '#ef4444', '#0ea5e9', '#f97316', '#b91c7c', '#0d7377',
];

export default function DisciplinasClient({ disciplinas }: { disciplinas: Disciplina[] }) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Disciplina | null>(null);
  const [excluindo, setExcluindo] = useState<Disciplina | null>(null);
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState(CORES_SUGERIDAS[0]);
  const [salvando, setSalvando] = useState(false);

  function abrirNova() {
    setEditando(null);
    setNome('');
    setCor(CORES_SUGERIDAS[disciplinas.length % CORES_SUGERIDAS.length]);
    setModalAberto(true);
  }

  function abrirEdicao(d: Disciplina) {
    setEditando(d);
    setNome(d.nome);
    setCor(d.cor);
    setModalAberto(true);
  }

  async function salvar() {
    if (!nome.trim()) return showToast('Dê um nome para a disciplina.', 'error');
    setSalvando(true);
    try {
      if (editando) {
        const { error } = await supabase.from('disciplinas').update({ nome: nome.trim(), cor }).eq('id', editando.id);
        if (error) throw new Error(error.message);
        showToast('Disciplina atualizada!', 'success');
      } else {
        const { error } = await supabase.from('disciplinas').insert({ nome: nome.trim(), cor });
        if (error) throw new Error(error.message);
        showToast('Disciplina criada!', 'success');
      }
      setModalAberto(false);
      router.refresh();
    } catch (e: any) {
      showToast('Erro: ' + e.message, 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    const { error } = await supabase.from('disciplinas').delete().eq('id', excluindo.id);
    if (error) {
      showToast('Erro ao excluir — verifique se ela não está em uso em notas, tarefas ou apostilas: ' + error.message, 'error');
      return;
    }
    showToast('Disciplina excluída.', 'success');
    setExcluindo(null);
    router.refresh();
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Disciplinas</h1><p>Matérias disponíveis para notas, tarefas, apostilas e resumos</p></div>
        <button className="btn btn-primary" onClick={abrirNova}>
          <IconPlus size={16} /> Nova Disciplina
        </button>
      </div>

      <div className="card">
        <div className="card-hd"><h3>Disciplinas cadastradas ({disciplinas.length})</h3></div>
        <div className="table-wrap">
          {disciplinas.length === 0 ? (
            <div className="empty-state"><h3>Nenhuma disciplina cadastrada</h3><p>Cadastre a primeira disciplina para liberar o lançamento de notas, tarefas e materiais para ela.</p></div>
          ) : (
            <table className="table">
              <thead><tr><th>Disciplina</th><th></th></tr></thead>
              <tbody>
                {disciplinas.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: d.cor }} />
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{d.nome}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => abrirEdicao(d)}><IconPencil size={15} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--re700)' }} onClick={() => setExcluindo(d)}><IconTrash size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar Disciplina' : 'Nova Disciplina'}
        footer={
          <>
            <button className="btn btn-primary" disabled={salvando} onClick={salvar}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button className="btn btn-outline" onClick={() => setModalAberto(false)}>Cancelar</button>
          </>
        }
      >
        <div className="fg">
          <label className="flabel">Nome da disciplina</label>
          <input className="finput" placeholder="Ex: Sociologia" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="fg" style={{ marginBottom: 0 }}>
          <label className="flabel">Cor</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {CORES_SUGERIDAS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCor(c)}
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: cor === c ? '3px solid var(--s900)' : '3px solid transparent',
                }}
              />
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!excluindo}
        onClose={() => setExcluindo(null)}
        title="Excluir disciplina"
        footer={
          <>
            <button className="btn btn-danger" onClick={confirmarExclusao}>Excluir definitivamente</button>
            <button className="btn btn-outline" onClick={() => setExcluindo(null)}>Cancelar</button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: 'var(--s600)' }}>
          Tem certeza que deseja excluir <strong>{excluindo?.nome}</strong>? Isso só é possível se não houver notas, tarefas ou materiais usando essa disciplina.
        </p>
      </Modal>
    </div>
  );
}
