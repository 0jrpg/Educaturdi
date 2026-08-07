'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch, IconCalendar, IconStar, IconX, IconUpload, IconPlus, IconTrash, IconFileUpload } from '@tabler/icons-react';
import Badge from '@/components/Badge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import NovaAtividadeModal from '@/components/forms/NovaAtividadeModal';
import type { Atividade, Disciplina, StatusAtividade, Turma } from '@/types/database';

interface AtividadeComStatus extends Atividade { status: StatusAtividade; }

function discCor(disciplinas: Disciplina[], nome: string) {
  return disciplinas.find(d => d.nome === nome)?.cor ?? '#64748b';
}
function diasAte(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}
function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtDataHora(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AtividadesClient({
  atividades, disciplinas, turmas, isAluno, podeGerenciar, turma, alunoId, respostasPorAtividade,
}: {
  atividades: AtividadeComStatus[];
  disciplinas: Disciplina[];
  turmas: Turma[];
  isAluno: boolean;
  podeGerenciar: boolean;
  turma: string | null;
  alunoId: string;
  respostasPorAtividade: Record<string, any[]>;
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<'todas' | StatusAtividade>('todas');
  const [busca, setBusca] = useState('');
  const [selecionada, setSelecionada] = useState<AtividadeComStatus | null>(null);
  const [excluindo, setExcluindo] = useState<AtividadeComStatus | null>(null);
  const [resposta, setResposta] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [modalNova, setModalNova] = useState(false);
  const showToast = useToast();
  const supabase = createClient();

  const base = isAluno ? atividades.filter(a => a.turmas.includes(turma ?? '')) : atividades;

  const counts = {
    todas: base.length,
    pendente: base.filter(a => a.status === 'pendente').length,
    entregue: base.filter(a => a.status === 'entregue').length,
    atrasado: base.filter(a => a.status === 'atrasado').length,
  };

  const filtradas = useMemo(() => {
    let list = base;
    if (filtro !== 'todas') list = list.filter(a => a.status === filtro);
    if (busca) {
      const b = busca.toLowerCase();
      list = list.filter(a => a.titulo.toLowerCase().includes(b) || a.disciplina.toLowerCase().includes(b));
    }
    return list;
  }, [base, filtro, busca]);

  function abrirDetalhes(a: AtividadeComStatus) {
    setSelecionada(a);
    setResposta('');
    setImagem(null);
    setPreviewImagem(null);
  }

  function selecionarImagem(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Envie uma imagem (foto ou print).', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('A imagem precisa ter no máximo 10 MB.', 'error');
      return;
    }
    setImagem(file);
    setPreviewImagem(URL.createObjectURL(file));
  }

  async function enviarResposta(atividadeId: string) {
    if (!resposta.trim() && !imagem) {
      showToast('Escreva sua resposta ou anexe uma foto antes de enviar.', 'error');
      return;
    }
    setEnviando(true);

    try {
      let arquivoUrl: string | null = null;

      if (imagem) {
        const nomeArquivo = `${alunoId}/${Date.now()}-${imagem.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('entregas-anexos')
          .upload(nomeArquivo, imagem, { contentType: imagem.type });
        if (uploadError) throw new Error(uploadError.message);
        const { data: urlData } = supabase.storage.from('entregas-anexos').getPublicUrl(nomeArquivo);
        arquivoUrl = urlData.publicUrl;
      }

      const payload: Record<string, any> = {
        atividade_id: atividadeId,
        aluno_id: alunoId,
        status: 'entregue',
        resposta: resposta.trim() || null,
        entregue_em: new Date().toISOString(),
      };
      // Só sobrescreve o anexo se o aluno mandou uma foto nova agora —
      // assim, reenviar só o texto não apaga uma imagem já enviada antes.
      if (arquivoUrl) payload.arquivo_url = arquivoUrl;

      const { error } = await supabase
        .from('entregas')
        .upsert(payload, { onConflict: 'atividade_id,aluno_id' });

      if (error) throw new Error(error.message);

      showToast('Resposta enviada com sucesso!', 'success');
      setSelecionada(null);
      router.refresh();
    } catch (e: any) {
      showToast('Erro ao enviar resposta: ' + e.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    const { error } = await supabase.from('atividades').delete().eq('id', excluindo.id);
    if (error) {
      showToast('Erro ao excluir: ' + error.message, 'error');
      return;
    }
    showToast('Atividade excluída.', 'success');
    setExcluindo(null);
    setSelecionada(null);
    router.refresh();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Atividades</h1>
          <p>{isAluno ? `Turma ${turma}` : 'Todas as turmas'} · 1º Semestre 2026</p>
        </div>
        {podeGerenciar && (
          <button className="btn btn-primary" onClick={() => setModalNova(true)}>
            <IconPlus size={16} /> Nova Atividade
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.3rem', flexWrap: 'wrap' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {(['todas', 'pendente', 'entregue', 'atrasado'] as const).map((f) => (
            <button
              key={f}
              className={`tab-btn ${filtro === f ? 'active' : ''}`}
              onClick={() => setFiltro(f)}
            >
              {{ todas: 'Todas', pendente: 'Pendentes', entregue: 'Entregues', atrasado: 'Atrasadas' }[f]}
              <span style={{ fontSize: 10, color: 'var(--s400)', marginLeft: 3 }}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="search-wrap">
          <IconSearch size={15} />
          <input
            className="finput search-input"
            placeholder="Buscar…"
            style={{ width: 220 }}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhuma atividade encontrada</h3>
          <p>Tente outro filtro ou busca.</p>
        </div>
      ) : filtradas.map((a) => {
        const diff = diasAte(a.prazo);
        const variant = a.status === 'entregue' ? 'green' : a.status === 'atrasado' ? 'red' : diff <= 2 ? 'amber' : 'blue';
        const txt = { pendente: 'Pendente', entregue: 'Entregue', atrasado: 'Atrasada' }[a.status];
        const numRespostas = respostasPorAtividade[a.id]?.length ?? 0;
        return (
          <div
            key={a.id}
            className="card"
            style={{ marginBottom: '0.9rem', cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
            onClick={() => abrirDetalhes(a)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--sh-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ display: 'flex', gap: 14, padding: '1.1rem 1.3rem' }}>
              <div style={{ width: 4, minHeight: 56, borderRadius: 4, background: discCor(disciplinas, a.disciplina), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 11, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--s900)', marginBottom: 3 }}>{a.titulo}</div>
                    <div style={{ fontSize: 12, color: 'var(--s400)' }}>{a.disciplina} · Turmas: {a.turmas.join(', ')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {!isAluno && <Badge variant="slate">{numRespostas} resposta{numRespostas === 1 ? '' : 's'}</Badge>}
                    {isAluno && <Badge variant={variant}>{txt}</Badge>}
                    {podeGerenciar && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--re700)' }}
                        onClick={(e) => { e.stopPropagation(); setExcluindo(a); }}
                      >
                        <IconTrash size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 9, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--s400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconCalendar size={13} /> {new Date(a.prazo).toLocaleDateString('pt-BR')}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--s400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconStar size={13} /> {a.pontos} pontos
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {selecionada && (
        <div className="modal-overlay" style={modalOverlayStyle} onClick={() => setSelecionada(null)}>
          <div className="modal-card" style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem', borderBottom: '1px solid var(--s100)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>{selecionada.titulo}</h2>
              <button className="btn btn-ghost" onClick={() => setSelecionada(null)}><IconX size={18} /></button>
            </div>
            <div style={{ padding: '1.4rem' }}>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: '1.1rem' }}>
                <Badge variant="blue">{selecionada.disciplina}</Badge>
                <Badge variant="slate">Turmas: {selecionada.turmas.join(', ')}</Badge>
                {isAluno && (
                  <Badge variant={selecionada.status === 'entregue' ? 'green' : selecionada.status === 'atrasado' ? 'red' : 'amber'}>
                    {{ pendente: 'Pendente', entregue: 'Entregue', atrasado: 'Atrasada' }[selecionada.status]}
                  </Badge>
                )}
              </div>
              <p style={{ fontSize: 14, color: 'var(--s600)', lineHeight: 1.75, marginBottom: '1.3rem' }}>
                {selecionada.descricao}
              </p>
              <div className="form-grid-2" style={{ marginBottom: isAluno || !podeGerenciar ? '1.3rem' : 0 }}>
                {[['Prazo', fmtData(selecionada.prazo)], ['Valor', `${selecionada.pontos} pontos`]].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--s50)', borderRadius: 10, padding: 11 }}>
                    <div style={{ fontSize: 10, color: 'var(--s400)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* ALUNO: formulário de resposta */}
              {isAluno && (
                <div style={{ borderTop: '1px solid var(--s100)', paddingTop: '1.2rem' }}>
                  <label className="flabel">
                    {selecionada.status === 'entregue' ? 'Sua resposta (você já enviou — pode reenviar pra atualizar)' : 'Sua resposta'}
                  </label>
                  <textarea
                    className="finput"
                    style={{ minHeight: 90 }}
                    placeholder="Escreva sua resposta aqui…"
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                  />
                  <label className="flabel" style={{ marginTop: 10, display: 'block' }}>Foto (opcional)</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
                    onDragLeave={() => setArrastando(false)}
                    onDrop={(e) => { e.preventDefault(); setArrastando(false); selecionarImagem(e.dataTransfer.files[0]); }}
                    onClick={() => document.getElementById('input-foto-resposta')?.click()}
                    style={{
                      border: `2px dashed ${arrastando ? 'var(--g500)' : 'var(--s300)'}`,
                      borderRadius: 12, padding: previewImagem ? 10 : '1.2rem', textAlign: 'center',
                      cursor: 'pointer', background: arrastando ? 'var(--g50)' : 'var(--s50)', transition: 'all .15s',
                    }}
                  >
                    <input
                      id="input-foto-resposta"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => selecionarImagem(e.target.files?.[0])}
                    />
                    {previewImagem ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={previewImagem} alt="Pré-visualização" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }} />
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--s800)' }}>{imagem?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--s400)' }}>Toque pra trocar a foto</div>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setImagem(null); setPreviewImagem(null); }} className="btn btn-ghost btn-sm">
                          <IconX size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <IconFileUpload size={22} style={{ color: 'var(--s400)', marginBottom: 5 }} />
                        <div style={{ fontSize: 12.5, color: 'var(--s500)' }}>Arraste uma foto aqui ou clique para escolher</div>
                        <div style={{ fontSize: 10.5, color: 'var(--s400)', marginTop: 2 }}>Fica disponível por 7 dias · Máximo 10 MB</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* PROFESSOR/ADMIN: respostas dos alunos */}
              {podeGerenciar && (
                <div style={{ borderTop: '1px solid var(--s100)', paddingTop: '1.2rem' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--s700)', marginBottom: 10 }}>
                    Respostas dos alunos ({(respostasPorAtividade[selecionada.id] ?? []).length})
                  </div>
                  {(respostasPorAtividade[selecionada.id] ?? []).length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--s400)' }}>Ninguém respondeu ainda.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
                      {(respostasPorAtividade[selecionada.id] ?? []).map((e: any) => (
                        <div key={e.id} style={{ background: 'var(--s50)', borderRadius: 10, padding: 11 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--s800)' }}>
                              {e.aluno?.nome ?? 'Aluno'} <span style={{ fontWeight: 400, color: 'var(--s400)' }}>· {e.aluno?.turma}</span>
                            </span>
                            {e.entregue_em && <span style={{ fontSize: 10.5, color: 'var(--s400)' }}>{fmtDataHora(e.entregue_em)}</span>}
                          </div>
                          {e.resposta && <p style={{ fontSize: 12.5, color: 'var(--s600)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{e.resposta}</p>}
                          {e.arquivo_url && (
                            <a href={e.arquivo_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6 }}>
                              <img src={e.arquivo_url} alt="Anexo do aluno" style={{ maxWidth: 140, maxHeight: 100, borderRadius: 8, border: '1px solid var(--s200)', objectFit: 'cover' }} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ padding: '1.1rem 1.4rem', borderTop: '1px solid var(--s100)', display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
              {isAluno && (
                <button className="btn btn-primary" disabled={enviando} onClick={() => enviarResposta(selecionada.id)}>
                  <IconUpload size={16} /> {enviando ? 'Enviando...' : selecionada.status === 'entregue' ? 'Reenviar resposta' : 'Enviar resposta'}
                </button>
              )}
              {podeGerenciar && (
                <button className="btn btn-outline" style={{ color: 'var(--re700)' }} onClick={() => setExcluindo(selecionada)}>
                  <IconTrash size={16} /> Excluir
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setSelecionada(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {podeGerenciar && (
        <NovaAtividadeModal
          open={modalNova}
          onClose={() => setModalNova(false)}
          disciplinas={disciplinas}
          turmas={turmas}
          professorId={alunoId}
        />
      )}

      {excluindo && (
        <div style={modalOverlayStyle} onClick={() => setExcluindo(null)}>
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.4rem', borderBottom: '1px solid var(--s100)' }}><h2 style={{ fontSize: 17, fontWeight: 600 }}>Excluir atividade</h2></div>
            <div style={{ padding: '1.4rem', fontSize: 14, color: 'var(--s600)' }}>
              Tem certeza que deseja excluir <strong>{excluindo.titulo}</strong>? As respostas dos alunos pra ela também serão apagadas.
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

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,.5)',
  backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
};
const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 24, boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
};
