'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch, IconDownload, IconUpload, IconX, IconEye, IconTrash } from '@tabler/icons-react';
import Badge from '@/components/Badge';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import NovaApostilaModal from '@/components/forms/NovaApostilaModal';
import DocumentViewer from '@/components/DocumentViewer';
import type { Apostila, Disciplina, Turma } from '@/types/database';

function discCor(disciplinas: Disciplina[], nome: string) {
  return disciplinas.find(d => d.nome === nome)?.cor ?? '#64748b';
}
function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ApostilasClient({
  apostilas, disciplinas, turmas, isAluno, professorId,
}: { apostilas: Apostila[]; disciplinas: Disciplina[]; turmas: Turma[]; isAluno: boolean; professorId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [busca, setBusca] = useState('');
  const [discFiltro, setDiscFiltro] = useState('');
  const [selecionada, setSelecionada] = useState<Apostila | null>(null);
  const [visualizando, setVisualizando] = useState<Apostila | null>(null);
  const [excluindo, setExcluindo] = useState<Apostila | null>(null);
  const [modalNova, setModalNova] = useState(false);
  const showToast = useToast();

  const discs = [...new Set(apostilas.map(a => a.disciplina))].sort();

  const filtradas = useMemo(() => {
    let list = apostilas;
    if (discFiltro) list = list.filter(a => a.disciplina === discFiltro);
    if (busca) {
      const b = busca.toLowerCase();
      list = list.filter(a => a.titulo.toLowerCase().includes(b) || a.disciplina.toLowerCase().includes(b));
    }
    return list;
  }, [apostilas, busca, discFiltro]);

  function baixar(a: Apostila) {
    if (a.arquivo_url) {
      window.open(a.arquivo_url, '_blank');
    } else {
      showToast('Nenhum arquivo foi enviado ainda para esta apostila.', 'warning');
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    const { error } = await supabase.from('apostilas').delete().eq('id', excluindo.id);
    if (error) {
      showToast('Erro ao excluir: ' + error.message, 'error');
      return;
    }
    showToast('Apostila excluída.', 'success');
    setExcluindo(null);
    setSelecionada(null);
    router.refresh();
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Apostilas & Materiais</h1><p>Materiais didáticos em PDF</p></div>
        {!isAluno && (
          <button className="btn btn-primary" onClick={() => setModalNova(true)}>
            <IconUpload size={16} /> Enviar Apostila
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 11, marginBottom: '1.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 180 }}>
          <IconSearch size={15} />
          <input className="finput search-input" placeholder="Buscar apostila…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select className="finput" style={{ width: 'auto' }} value={discFiltro} onChange={(e) => setDiscFiltro(e.target.value)}>
          <option value="">Todas as disciplinas</option>
          {discs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {filtradas.length === 0 ? (
        <div className="empty-state"><h3>Nenhuma apostila encontrada</h3></div>
      ) : (
        <div className="grid-auto">
          {filtradas.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--sh-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ background: `${discCor(disciplinas, a.disciplina)}18`, padding: '1.3rem', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 36, lineHeight: 1 }}>{a.emoji}</span>
                {a.paginas && <Badge variant="slate">{a.paginas} págs.</Badge>}
              </div>
              <div style={{ padding: '1.1rem' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--s900)', marginBottom: 3, lineHeight: 1.35 }}>{a.titulo}</div>
                <p style={{ fontSize: 12, color: 'var(--s500)', lineHeight: 1.55, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {a.descricao}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span className="badge" style={{ background: `${discCor(disciplinas, a.disciplina)}20`, color: discCor(disciplinas, a.disciplina), fontSize: 10 }}>{a.disciplina}</span>
                  <Badge variant="slate">Turmas: {a.turmas.join(', ')}</Badge>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    disabled={!a.arquivo_url}
                    onClick={() => setVisualizando(a)}
                  >
                    <IconEye size={15} /> Visualizar
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelecionada(a)}>
                    Detalhes
                  </button>
                  {!isAluno && (
                    <button className="btn btn-outline btn-sm" style={{ color: 'var(--re700)' }} onClick={() => setExcluindo(a)}>
                      <IconTrash size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selecionada && (
        <div style={overlayStyle} onClick={() => setSelecionada(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem', borderBottom: '1px solid var(--s100)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>{selecionada.titulo}</h2>
              <button className="btn btn-ghost" onClick={() => setSelecionada(null)}><IconX size={18} /></button>
            </div>
            <div style={{ padding: '1.4rem' }}>
              <p style={{ fontSize: 14, color: 'var(--s600)', lineHeight: 1.75, marginBottom: '1.3rem' }}>{selecionada.descricao}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Páginas', selecionada.paginas ? `${selecionada.paginas} páginas` : '—'], ['Publicado', fmtData(selecionada.created_at)]].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--s50)', borderRadius: 10, padding: 11 }}>
                    <div style={{ fontSize: 10, color: 'var(--s400)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '1.1rem 1.4rem', borderTop: '1px solid var(--s100)', display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                disabled={!selecionada.arquivo_url}
                onClick={() => { setVisualizando(selecionada); setSelecionada(null); }}
              >
                <IconEye size={16} /> Visualizar
              </button>
              <button className="btn btn-outline" onClick={() => baixar(selecionada)}><IconDownload size={16} /> Baixar</button>
              {!isAluno && (
                <button className="btn btn-outline" style={{ color: 'var(--re700)' }} onClick={() => setExcluindo(selecionada)}>
                  <IconTrash size={16} /> Excluir
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setSelecionada(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {!isAluno && (
        <NovaApostilaModal
          open={modalNova}
          onClose={() => setModalNova(false)}
          disciplinas={disciplinas}
          turmas={turmas}
          professorId={professorId}
        />
      )}

      <DocumentViewer
        open={!!visualizando}
        onClose={() => setVisualizando(null)}
        titulo={visualizando?.titulo ?? ''}
        subtitulo={visualizando ? `${visualizando.disciplina} · Turmas: ${visualizando.turmas.join(', ')}` : ''}
        disciplinaCor={visualizando ? discCor(disciplinas, visualizando.disciplina) : undefined}
        arquivoUrl={visualizando?.arquivo_url ?? null}
      />

      {excluindo && (
        <div style={overlayStyle} onClick={() => setExcluindo(null)}>
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.4rem', borderBottom: '1px solid var(--s100)' }}><h2 style={{ fontSize: 17, fontWeight: 600 }}>Excluir apostila</h2></div>
            <div style={{ padding: '1.4rem', fontSize: 14, color: 'var(--s600)' }}>
              Tem certeza que deseja excluir <strong>{excluindo.titulo}</strong>? Essa ação não pode ser desfeita.
            </div>
            <div style={{ padding: '1.1rem 1.4rem', borderTop: '1px solid var(--s100)', display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
              <button className="btn btn-danger" onClick={confirmarExclusao}>Excluir definitivamente</button>
              <button className="btn btn-outline" onClick={() => setExcluindo(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' };
const modalStyle: React.CSSProperties = { background: '#fff', borderRadius: 24, boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' };
