'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconFlag3, IconPlus, IconTrash, IconAlertTriangle, IconSearch } from '@tabler/icons-react';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import { emitirFicha, LIMITE_CHAMAR_RESPONSAVEL } from '@/lib/fichas';
import type { Profile } from '@/types/database';

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function initials(nome: string) { return nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(); }

export default function FichasClient({
  podeGerenciar, fichas, alunos, proprioAlunoId,
}: { podeGerenciar: boolean; fichas: any[]; alunos: Profile[]; proprioAlunoId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [modalNova, setModalNova] = useState(false);
  const [excluindo, setExcluindo] = useState<any | null>(null);
  const [busca, setBusca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<string | null>(null);

  const [alunoIdForm, setAlunoIdForm] = useState(alunos[0]?.id ?? '');
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const contagemPorAluno = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of fichas) m.set(f.aluno_id, (m.get(f.aluno_id) ?? 0) + 1);
    return m;
  }, [fichas]);

  const alunosEmAlerta = useMemo(
    () => alunos.filter(a => (contagemPorAluno.get(a.id) ?? 0) >= LIMITE_CHAMAR_RESPONSAVEL),
    [alunos, contagemPorAluno]
  );

  const fichasFiltradas = useMemo(() => {
    let list = fichas;
    if (alunoSelecionado) list = list.filter(f => f.aluno_id === alunoSelecionado);
    if (busca) {
      const b = busca.toLowerCase();
      list = list.filter(f => f.motivo.toLowerCase().includes(b) || f.aluno?.nome?.toLowerCase().includes(b));
    }
    return list;
  }, [fichas, alunoSelecionado, busca]);

  async function salvar() {
    if (!alunoIdForm) return showToast('Selecione o aluno.', 'error');
    if (!motivo.trim()) return showToast('Explique o motivo da ficha.', 'error');

    setSalvando(true);
    const { error } = await emitirFicha(supabase, { alunoId: alunoIdForm, motivo: motivo.trim(), autorId: proprioAlunoId });
    setSalvando(false);

    if (error) return showToast('Erro: ' + error.message, 'error');

    showToast('Ficha emitida.', 'warning');
    setMotivo('');
    setModalNova(false);
    router.refresh();
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    const { error } = await supabase.from('fichas').delete().eq('id', excluindo.id);
    if (error) return showToast('Erro ao remover: ' + error.message, 'error');
    showToast('Ficha removida.', 'success');
    setExcluindo(null);
    router.refresh();
  }

  if (!podeGerenciar) {
    return (
      <div>
        <div className="page-header">
          <div><h1>Minhas Fichas</h1><p>Registro de advertências de comportamento</p></div>
        </div>

        <div className="stat-card" style={{ maxWidth: 260, marginBottom: '1.4rem' }}>
          <div className="stat-icon si-r"><IconFlag3 size={19} /></div>
          <div className="stat-lbl">Total de fichas</div>
          <div className="stat-val">{fichas.length}</div>
          {fichas.length >= LIMITE_CHAMAR_RESPONSAVEL && (
            <div className="stat-sub" style={{ color: 'var(--re700)' }}>Responsável será chamado</div>
          )}
        </div>

        {fichas.length === 0 ? (
          <div className="empty-state"><IconFlag3 size={26} /><h3>Nenhuma ficha registrada</h3><p>Continue assim!</p></div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Data</th><th>Motivo</th><th>Emitida por</th></tr></thead>
                <tbody>
                  {fichas.map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontSize: 12, color: 'var(--s400)', whiteSpace: 'nowrap' }}>{fmtData(f.created_at)}</td>
                      <td>{f.motivo}</td>
                      <td style={{ fontSize: 12, color: 'var(--s400)' }}>{f.autor?.nome ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Fichas</h1><p>Registro de advertências de comportamento por aluno</p></div>
        <button className="btn btn-primary" onClick={() => setModalNova(true)}>
          <IconPlus size={16} /> Emitir Ficha
        </button>
      </div>

      {alunosEmAlerta.length > 0 && (
        <div style={{ background: 'var(--re50)', border: '1px solid var(--re100)', borderRadius: 14, padding: '1rem 1.2rem', marginBottom: '1.4rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <IconAlertTriangle size={20} style={{ color: 'var(--re700)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--re700)', marginBottom: 4 }}>
              {alunosEmAlerta.length} aluno{alunosEmAlerta.length > 1 ? 's' : ''} com {LIMITE_CHAMAR_RESPONSAVEL}+ fichas — responsável deve ser chamado
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {alunosEmAlerta.map(a => (
                <button key={a.id} className="badge br" style={{ cursor: 'pointer' }} onClick={() => setAlunoSelecionado(a.id)}>
                  {a.nome} ({contagemPorAluno.get(a.id)})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: '1.4rem' }}>
        <div className="stat-card">
          <div className="stat-icon si-r"><IconFlag3 size={19} /></div>
          <div className="stat-lbl">Total de fichas</div>
          <div className="stat-val">{fichas.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-a"><IconAlertTriangle size={19} /></div>
          <div className="stat-lbl">Alunos em alerta</div>
          <div className="stat-val">{alunosEmAlerta.length}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--s100)', flexWrap: 'wrap', gap: 10 }}>
          <div className="search-wrap">
            <IconSearch size={15} />
            <input className="finput search-input" style={{ width: 220 }} placeholder="Buscar por aluno ou motivo…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          {alunoSelecionado && (
            <button className="btn btn-outline btn-sm" onClick={() => setAlunoSelecionado(null)}>
              Filtrando por: {alunos.find(a => a.id === alunoSelecionado)?.nome} ×
            </button>
          )}
        </div>
        <div className="table-wrap">
          {fichasFiltradas.length === 0 ? (
            <div className="empty-state"><h3>Nenhuma ficha encontrada</h3></div>
          ) : (
            <table className="table">
              <thead><tr><th>Aluno</th><th>Motivo</th><th>Emitida por</th><th>Data</th><th></th></tr></thead>
              <tbody>
                {fichasFiltradas.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--re100)', color: 'var(--re700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                          {initials(f.aluno?.nome ?? '?')}
                        </div>
                        <span style={{ fontWeight: 500 }}>{f.aluno?.nome}</span>
                        {(contagemPorAluno.get(f.aluno_id) ?? 0) >= LIMITE_CHAMAR_RESPONSAVEL && <Badge variant="red">alerta</Badge>}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{f.motivo}</td>
                    <td style={{ fontSize: 12, color: 'var(--s400)' }}>{f.autor?.nome ?? '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--s400)', whiteSpace: 'nowrap' }}>{fmtData(f.created_at)}</td>
                    <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--re700)' }} onClick={() => setExcluindo(f)}><IconTrash size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={modalNova}
        onClose={() => setModalNova(false)}
        title="Emitir Ficha"
        footer={<><button className="btn btn-primary" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando...' : 'Emitir Ficha'}</button><button className="btn btn-outline" onClick={() => setModalNova(false)}>Cancelar</button></>}
      >
        <div className="fg">
          <label className="flabel">Aluno</label>
          <select className="finput" value={alunoIdForm} onChange={(e) => setAlunoIdForm(e.target.value)}>
            {alunos.map(a => <option key={a.id} value={a.id}>{a.nome} — Turma {a.turma}</option>)}
          </select>
        </div>
        <div className="fg" style={{ marginBottom: 0 }}>
          <label className="flabel">Motivo</label>
          <textarea className="finput" placeholder="Ex: Desrespeitou o professor durante a aula…" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={!!excluindo}
        onClose={() => setExcluindo(null)}
        title="Remover ficha"
        footer={<><button className="btn btn-danger" onClick={confirmarExclusao}>Remover</button><button className="btn btn-outline" onClick={() => setExcluindo(null)}>Cancelar</button></>}
      >
        <p style={{ fontSize: 14, color: 'var(--s600)' }}>Remover a ficha de <strong>{excluindo?.aluno?.nome}</strong>?</p>
      </Modal>
    </div>
  );
}
