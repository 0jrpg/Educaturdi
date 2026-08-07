'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch, IconDownload, IconUpload, IconEye, IconTrash, IconFileText } from '@tabler/icons-react';
import Badge from '@/components/Badge';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import NovoResumoModal from '@/components/forms/NovoResumoModal';
import DocumentViewer from '@/components/DocumentViewer';
import type { Resumo, Disciplina, Turma } from '@/types/database';

function discCor(disciplinas: Disciplina[], nome: string) {
  return disciplinas.find(d => d.nome === nome)?.cor ?? '#64748b';
}
function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function rotuloTipo(tipo: string | null) {
  if (!tipo) return 'Arquivo';
  if (tipo === 'pdf') return 'PDF';
  if (tipo === 'doc' || tipo === 'docx') return 'Word';
  return tipo.toUpperCase();
}

export default function ResumosClient({
  resumos, disciplinas, turmas, isAluno, podeGerenciar, professorId,
}: {
  resumos: Resumo[];
  disciplinas: Disciplina[];
  turmas: Turma[];
  isAluno: boolean;
  podeGerenciar: boolean;
  professorId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [busca, setBusca] = useState('');
  const [discFiltro, setDiscFiltro] = useState('');
  const [visualizando, setVisualizando] = useState<Resumo | null>(null);
  const [excluindo, setExcluindo] = useState<Resumo | null>(null);
  const [modalNovo, setModalNovo] = useState(false);

  const discs = [...new Set(resumos.map(r => r.disciplina))].sort();

  const filtrados = useMemo(() => {
    let list = resumos;
    if (discFiltro) list = list.filter(r => r.disciplina === discFiltro);
    if (busca) {
      const b = busca.toLowerCase();
      list = list.filter(r => r.titulo.toLowerCase().includes(b) || r.disciplina.toLowerCase().includes(b));
    }
    return list;
  }, [resumos, busca, discFiltro]);

  function baixar(r: Resumo) {
    if (r.arquivo_url) window.open(r.arquivo_url, '_blank');
    else showToast('Nenhum arquivo foi enviado ainda para este resumo.', 'warning');
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    const { error } = await supabase.from('resumos').delete().eq('id', excluindo.id);
    if (error) {
      showToast('Erro ao excluir: ' + error.message, 'error');
      return;
    }
    showToast('Resumo excluído.', 'success');
    setExcluindo(null);
    router.refresh();
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Resumos</h1><p>Resumos de aula em PDF ou Word, prontos para estudar</p></div>
        {podeGerenciar && (
          <button className="btn btn-primary" onClick={() => setModalNovo(true)}>
            <IconUpload size={16} /> Enviar Resumo
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 11, marginBottom: '1.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 180 }}>
          <IconSearch size={15} />
          <input className="finput search-input" placeholder="Buscar resumo…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select className="finput" style={{ width: 'auto' }} value={discFiltro} onChange={(e) => setDiscFiltro(e.target.value)}>
          <option value="">Todas as disciplinas</option>
          {discs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="empty-state"><h3>Nenhum resumo encontrado</h3></div>
      ) : (
        <div className="grid-auto">
          {filtrados.map((r) => (
            <div
              key={r.id}
              className="card"
              style={{ transition: 'transform .15s, box-shadow .15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--sh-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ background: `${discCor(disciplinas, r.disciplina)}18`, padding: '1.3rem', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IconFileText size={30} style={{ color: discCor(disciplinas, r.disciplina) }} />
                <Badge variant="slate">{rotuloTipo(r.tipo_arquivo)}</Badge>
              </div>
              <div style={{ padding: '1.1rem' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--s900)', marginBottom: 3, lineHeight: 1.35 }}>{r.titulo}</div>
                <p style={{ fontSize: 12, color: 'var(--s500)', lineHeight: 1.55, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {r.descricao}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span className="badge" style={{ background: `${discCor(disciplinas, r.disciplina)}20`, color: discCor(disciplinas, r.disciplina), fontSize: 10 }}>{r.disciplina}</span>
                  <Badge variant="slate">Turmas: {r.turmas.join(', ')}</Badge>
                </div>
                <div style={{ fontSize: 11, color: 'var(--s400)', marginBottom: 10 }}>Publicado em {fmtData(r.created_at)}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    disabled={!r.arquivo_url}
                    onClick={() => setVisualizando(r)}
                  >
                    <IconEye size={15} /> Visualizar
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => baixar(r)}>
                    <IconDownload size={15} />
                  </button>
                  {podeGerenciar && (
                    <button className="btn btn-outline btn-sm" style={{ color: 'var(--re700)' }} onClick={() => setExcluindo(r)}>
                      <IconTrash size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {podeGerenciar && (
        <NovoResumoModal
          open={modalNovo}
          onClose={() => setModalNovo(false)}
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setExcluindo(null)}>
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.4rem', borderBottom: '1px solid var(--s100)' }}><h2 style={{ fontSize: 17, fontWeight: 600 }}>Excluir resumo</h2></div>
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
