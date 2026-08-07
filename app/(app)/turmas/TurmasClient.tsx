'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import type { Turma } from '@/types/database';

export default function TurmasClient({
  turmas, contagemAlunos, podeGerenciar,
}: {
  turmas: Turma[];
  contagemAlunos: Record<string, number>;
  podeGerenciar: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Turma | null>(null);
  const [excluindo, setExcluindo] = useState<Turma | null>(null);

  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  const [nivel, setNivel] = useState('');
  const [periodo, setPeriodo] = useState('Manhã');
  const [sala, setSala] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [salvando, setSalvando] = useState(false);

  function abrirNova() {
    setEditando(null);
    setId(''); setNome(''); setNivel(''); setPeriodo('Manhã'); setSala(''); setResponsavel('');
    setModalAberto(true);
  }

  function abrirEdicao(t: Turma) {
    setEditando(t);
    setId(t.id); setNome(t.nome); setNivel(t.nivel); setPeriodo(t.periodo); setSala(t.sala ?? ''); setResponsavel(t.responsavel ?? '');
    setModalAberto(true);
  }

  async function salvar() {
    if (!id.trim()) return showToast('Informe a sigla/código da turma (ex: 3B).', 'error');
    if (!nome.trim()) return showToast('Informe o nome da turma.', 'error');
    if (!nivel.trim()) return showToast('Informe o nível/série.', 'error');

    setSalvando(true);
    try {
      if (editando) {
        const { error } = await supabase.from('turmas').update({
          nome: nome.trim(), nivel: nivel.trim(), periodo, sala: sala.trim() || null, responsavel: responsavel.trim() || null,
        }).eq('id', editando.id);
        if (error) throw new Error(error.message);
        showToast('Turma atualizada!', 'success');
      } else {
        const { error } = await supabase.from('turmas').insert({
          id: id.trim(), nome: nome.trim(), nivel: nivel.trim(), periodo, sala: sala.trim() || null, responsavel: responsavel.trim() || null,
        });
        if (error) throw new Error(error.message);
        showToast('Turma criada!', 'success');
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
    const { error } = await supabase.from('turmas').delete().eq('id', excluindo.id);
    if (error) {
      showToast('Erro ao excluir — verifique se não há alunos, atividades ou materiais usando essa turma: ' + error.message, 'error');
      return;
    }
    showToast('Turma excluída.', 'success');
    setExcluindo(null);
    router.refresh();
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Turmas</h1><p>Turmas cadastradas no sistema</p></div>
        {podeGerenciar && (
          <button className="btn btn-primary" onClick={abrirNova}>
            <IconPlus size={16} /> Nova Turma
          </button>
        )}
      </div>

      {turmas.length === 0 ? (
        <div className="empty-state"><h3>Nenhuma turma cadastrada</h3></div>
      ) : (
        <div className="grid-3">
          {turmas.map((t) => (
            <div key={t.id} className="card" style={{ transition: 'transform .15s, box-shadow .15s' }}>
              <div style={{ padding: '1.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 11, background: 'var(--g100)', color: 'var(--g700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>{t.id}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Badge variant="green">{t.periodo}</Badge>
                    {podeGerenciar && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => abrirEdicao(t)}><IconPencil size={14} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--re700)' }} onClick={() => setExcluindo(t)}><IconTrash size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--s900)', marginBottom: 3 }}>{t.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--s400)', marginBottom: '1rem' }}>{t.nivel}{t.sala ? ` · Sala ${t.sala}` : ''}</div>
                <div style={{ height: 1, background: 'var(--s100)', marginBottom: '1rem' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--s400)' }}>Alunos</span><span style={{ fontWeight: 600 }}>{contagemAlunos[t.id] ?? 0}</span>
                </div>
                {t.responsavel && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--s400)' }}>Responsável</span><span style={{ fontWeight: 600, fontSize: 12 }}>{t.responsavel}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar Turma' : 'Nova Turma'}
        footer={
          <>
            <button className="btn btn-primary" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Salvar'}</button>
            <button className="btn btn-outline" onClick={() => setModalAberto(false)}>Cancelar</button>
          </>
        }
      >
        <div className="form-grid-2">
          <div className="fg">
            <label className="flabel">Sigla/Código {editando && <span style={{ color: 'var(--s400)' }}>(não pode ser alterado)</span>}</label>
            <input className="finput" placeholder="Ex: 3B" value={id} disabled={!!editando} onChange={(e) => setId(e.target.value)} />
          </div>
          <div className="fg">
            <label className="flabel">Nível/Série</label>
            <input className="finput" placeholder="Ex: 3º Ano Ensino Médio" value={nivel} onChange={(e) => setNivel(e.target.value)} />
          </div>
        </div>
        <div className="fg">
          <label className="flabel">Nome da turma</label>
          <input className="finput" placeholder="Ex: 3º Ano B" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="form-grid-2">
          <div className="fg">
            <label className="flabel">Período</label>
            <select className="finput" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Noite">Noite</option>
              <option value="Integral">Integral</option>
            </select>
          </div>
          <div className="fg">
            <label className="flabel">Sala (opcional)</label>
            <input className="finput" placeholder="Ex: 12" value={sala} onChange={(e) => setSala(e.target.value)} />
          </div>
        </div>
        <div className="fg" style={{ marginBottom: 0 }}>
          <label className="flabel">Responsável (opcional)</label>
          <input className="finput" placeholder="Ex: Prof. Ana Turdi" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={!!excluindo}
        onClose={() => setExcluindo(null)}
        title="Excluir turma"
        footer={
          <>
            <button className="btn btn-danger" onClick={confirmarExclusao}>Excluir definitivamente</button>
            <button className="btn btn-outline" onClick={() => setExcluindo(null)}>Cancelar</button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: 'var(--s600)' }}>
          Tem certeza que deseja excluir <strong>{excluindo?.nome}</strong>?
        </p>
      </Modal>
    </div>
  );
}
