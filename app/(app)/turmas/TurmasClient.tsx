'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconPencil, IconTrash, IconUsers } from '@tabler/icons-react';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import { usePresenceMap } from '@/lib/usePresenceMap';
import { calcularStatus } from '@/lib/presence';
import StatusPresenca from '@/components/StatusDot';
import type { Turma, Profile } from '@/types/database';

function initials(nome: string) { return nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(); }

export default function TurmasClient({
  turmas, alunos, contagemAlunos, podeGerenciar,
}: {
  turmas: Turma[];
  alunos: Profile[];
  contagemAlunos: Record<string, number>;
  podeGerenciar: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();
  const presenca = usePresenceMap();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Turma | null>(null);
  const [excluindo, setExcluindo] = useState<Turma | null>(null);
  const [verAlunos, setVerAlunos] = useState<Turma | null>(null);

  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  const [nivel, setNivel] = useState('');
  const [periodo, setPeriodo] = useState('Manhã');
  const [sala, setSala] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [salvando, setSalvando] = useState(false);

  const onlinePorTurma = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of alunos) {
      if (!a.turma) continue;
      const status = calcularStatus(presenca[a.id]?.last_seen ?? null);
      if (status === 'online') m[a.turma] = (m[a.turma] ?? 0) + 1;
    }
    return m;
  }, [alunos, presenca]);

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
      showToast('Erro ao excluir — verifique se não há alunos, tarefas ou materiais usando essa turma: ' + error.message, 'error');
      return;
    }
    showToast('Turma excluída.', 'success');
    setExcluindo(null);
    router.refresh();
  }

  const alunosDaTurmaSelecionada = useMemo(() => {
    if (!verAlunos) return [];
    return alunos.filter(a => a.turma === verAlunos.id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [verAlunos, alunos]);

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
          {turmas.map((t) => {
            const online = onlinePorTurma[t.id] ?? 0;
            return (
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, alignItems: 'center' }}>
                    <span style={{ color: 'var(--s400)' }}>Alunos</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>{contagemAlunos[t.id] ?? 0}</span>
                      {online > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                          {online} online
                        </span>
                      )}
                    </span>
                  </div>
                  {t.responsavel && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                      <span style={{ color: 'var(--s400)' }}>Responsável</span><span style={{ fontWeight: 600, fontSize: 12 }}>{t.responsavel}</span>
                    </div>
                  )}
                  <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={() => setVerAlunos(t)}>
                    <IconUsers size={14} /> Ver alunos e status
                  </button>
                </div>
              </div>
            );
          })}
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
        open={!!verAlunos}
        onClose={() => setVerAlunos(null)}
        title={verAlunos ? `Alunos — Turma ${verAlunos.id}` : ''}
      >
        {alunosDaTurmaSelecionada.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--s400)' }}>Nenhum aluno matriculado nesta turma ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alunosDaTurmaSelecionada.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'var(--s50)', borderRadius: 10, padding: '9px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--g100)', color: 'var(--g700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {initials(a.nome)}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--s800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nome}</span>
                </div>
                <StatusPresenca
                  lastSeen={presenca[a.id]?.last_seen ?? null}
                  pagina={presenca[a.id]?.pagina}
                  contextoTipo={presenca[a.id]?.contexto_tipo}
                  contextoTitulo={presenca[a.id]?.contexto_titulo}
                  compacto
                />
              </div>
            ))}
          </div>
        )}
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
