'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconSearch, IconCalendar, IconStar, IconX, IconUpload, IconPlus, IconTrash,
  IconFileUpload, IconEyeCheck, IconEyeOff, IconThumbUp, IconThumbDown, IconFlag3,
} from '@tabler/icons-react';
import Badge from '@/components/Badge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import NovaTarefaModal from '@/components/forms/NovaTarefaModal';
import { usePresenceMap } from '@/lib/usePresenceMap';
import { usePresenceContext } from '@/components/PresenceProvider';
import StatusPresenca, { StatusDotSimples } from '@/components/StatusDot';
import { calcularValorEntrega, GRAU_LABEL, GRAU_VARIANT, DIAS_TOLERANCIA } from '@/lib/tarefas';
import { emitirFicha } from '@/lib/fichas';
import type { Disciplina, StatusEntrega, Turma, Profile, Grau } from '@/types/database';

interface ItemComStatus {
  id: string; titulo: string; descricao: string | null; disciplina: string; turmas: string[];
  prazo: string; pontos: number; grau: Grau; status: StatusEntrega;
}

function discCor(disciplinas: Disciplina[], nome: string) {
  return disciplinas.find(d => d.nome === nome)?.cor ?? '#64748b';
}
function diasAte(iso: string) {
  return Math.ceil((new Date(`${iso}T23:59:59`).getTime() - Date.now()) / 86400000);
}
function fmtData(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtDataHora(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Record<StatusEntrega, string> = {
  pendente: 'Pendente', entregue: 'Entregue', atrasado: 'Atrasada', recusada: 'Recusada',
};
const STATUS_VARIANT: Record<StatusEntrega, 'green' | 'amber' | 'red' | 'blue' | 'slate'> = {
  pendente: 'blue', entregue: 'green', atrasado: 'red', recusada: 'red',
};

export default function TarefaTrabalhoClient({
  modo, tabela, tabelaEntregas, colunaFk, itens, disciplinas, turmas, isAluno, podeGerenciar,
  turma, alunoId, respostasPorItem, alunos,
}: {
  modo: 'tarefa' | 'trabalho';
  tabela: string;
  tabelaEntregas: string;
  colunaFk: string;
  itens: ItemComStatus[];
  disciplinas: Disciplina[];
  turmas: Turma[];
  isAluno: boolean;
  podeGerenciar: boolean;
  turma: string | null;
  alunoId: string;
  respostasPorItem: Record<string, any[]>;
  alunos: Profile[];
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<'todas' | StatusEntrega>('todas');
  const [busca, setBusca] = useState('');
  const [selecionada, setSelecionada] = useState<ItemComStatus | null>(null);
  const [excluindo, setExcluindo] = useState<ItemComStatus | null>(null);
  const [resposta, setResposta] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [modalNova, setModalNova] = useState(false);
  const [recusandoAlunoId, setRecusandoAlunoId] = useState<string | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const showToast = useToast();
  const supabase = createClient();
  const presenca = usePresenceMap();
  const definirContexto = usePresenceContext();

  const rotulo = modo === 'tarefa' ? 'Tarefa' : 'Trabalho';
  const rotuloPlural = modo === 'tarefa' ? 'Tarefas' : 'Trabalhos';

  const base = isAluno ? itens.filter(a => a.turmas.includes(turma ?? '')) : itens;

  const counts = {
    todas: base.length,
    pendente: base.filter(a => a.status === 'pendente').length,
    entregue: base.filter(a => a.status === 'entregue').length,
    atrasado: base.filter(a => a.status === 'atrasado').length,
    recusada: base.filter(a => a.status === 'recusada').length,
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

  useEffect(() => {
    if (selecionada) {
      definirContexto({ tipo: modo, titulo: selecionada.titulo });
      return () => definirContexto(null);
    }
  }, [selecionada, definirContexto, modo]);

  async function registrarAbertura(a: ItemComStatus) {
    const { data: existente } = await supabase
      .from(tabelaEntregas).select('id, visto_em').eq(colunaFk, a.id).eq('aluno_id', alunoId).maybeSingle();

    if (!existente) {
      await supabase.from(tabelaEntregas).insert({
        [colunaFk]: a.id, aluno_id: alunoId,
        status: diasAte(a.prazo) < 0 ? 'atrasado' : 'pendente',
        visto_em: new Date().toISOString(),
      });
    } else if (!existente.visto_em) {
      await supabase.from(tabelaEntregas).update({ visto_em: new Date().toISOString() }).eq('id', existente.id);
    }
  }

  function abrirDetalhes(a: ItemComStatus) {
    setSelecionada(a);
    setResposta('');
    setImagem(null);
    setPreviewImagem(null);
    setRecusandoAlunoId(null);
    if (isAluno) registrarAbertura(a);
  }

  function selecionarImagem(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('Envie uma imagem (foto ou print).', 'error');
    if (file.size > 10 * 1024 * 1024) return showToast('A imagem precisa ter no máximo 10 MB.', 'error');
    setImagem(file);
    setPreviewImagem(URL.createObjectURL(file));
  }

  async function enviarResposta(item: ItemComStatus) {
    if (!resposta.trim() && !imagem) return showToast('Escreva sua resposta ou anexe uma foto antes de enviar.', 'error');
    setEnviando(true);

    try {
      let arquivoUrl: string | null = null;
      if (imagem) {
        const bucket = modo === 'tarefa' ? 'entregas-anexos' : 'entregas-anexos';
        const nomeArquivo = `${alunoId}/${Date.now()}-${imagem.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(nomeArquivo, imagem, { contentType: imagem.type });
        if (uploadError) throw new Error(uploadError.message);
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(nomeArquivo);
        arquivoUrl = urlData.publicUrl;
      }

      const agora = new Date();
      const { valor } = calcularValorEntrega(item.prazo, item.grau, item.pontos, agora);

      const payload: Record<string, any> = {
        [colunaFk]: item.id,
        aluno_id: alunoId,
        status: 'entregue',
        resposta: resposta.trim() || null,
        entregue_em: agora.toISOString(),
        visto_em: agora.toISOString(),
        nota_obtida: valor,
        motivo_recusa: null,
      };
      if (arquivoUrl) payload.arquivo_url = arquivoUrl;

      const { error } = await supabase.from(tabelaEntregas).upsert(payload, { onConflict: `${colunaFk},aluno_id` });
      if (error) throw new Error(error.message);

      showToast(`Resposta enviada! Valendo ${valor.toFixed(1)} de ${item.pontos.toFixed(1)} pontos.`, 'success');
      setSelecionada(null);
      router.refresh();
    } catch (e: any) {
      showToast('Erro ao enviar resposta: ' + e.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  async function recusarEntrega(entregaId: string) {
    if (!motivoRecusa.trim()) return showToast('Explique o motivo da recusa.', 'error');
    const { error } = await supabase.from(tabelaEntregas).update({
      status: 'recusada', nota_obtida: 0, motivo_recusa: motivoRecusa.trim(),
    }).eq('id', entregaId);
    if (error) return showToast('Erro: ' + error.message, 'error');
    showToast('Entrega recusada — o aluno pode reenviar.', 'warning');
    setRecusandoAlunoId(null);
    setMotivoRecusa('');
    router.refresh();
  }

  async function emitirFichaPorNaoEntrega(alunoIdAlvo: string, nomeAluno: string, itemTitulo: string) {
    const motivo = `Não entregou "${itemTitulo}" mesmo após a segunda chance.`;
    const { error } = await emitirFicha(supabase, { alunoId: alunoIdAlvo, motivo, autorId: alunoId, origem: modo });
    if (error) return showToast('Erro ao emitir ficha: ' + error.message, 'error');
    showToast(`Ficha emitida para ${nomeAluno}.`, 'warning');
    router.refresh();
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    const { error } = await supabase.from(tabela).delete().eq('id', excluindo.id);
    if (error) return showToast('Erro ao excluir: ' + error.message, 'error');
    showToast(`${rotulo} excluída.`, 'success');
    setExcluindo(null);
    setSelecionada(null);
    router.refresh();
  }

  function alunosDoItem(a: ItemComStatus) {
    return alunos
      .filter(al => al.turma && a.turmas.includes(al.turma))
      .map(al => ({ aluno: al, entrega: (respostasPorItem[a.id] ?? []).find((e: any) => e.aluno_id === al.id) ?? null }))
      .sort((x, y) => x.aluno.nome.localeCompare(y.aluno.nome, 'pt-BR'));
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{rotuloPlural}</h1>
          <p>{isAluno ? `Turma ${turma}` : 'Todas as turmas'} · 1º Semestre 2026</p>
        </div>
        {podeGerenciar && (
          <button className="btn btn-primary" onClick={() => setModalNova(true)}>
            <IconPlus size={16} /> Nova {rotulo}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.3rem', flexWrap: 'wrap' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {(['todas', 'pendente', 'entregue', 'atrasado', 'recusada'] as const).map((f) => (
            <button key={f} className={`tab-btn ${filtro === f ? 'active' : ''}`} onClick={() => setFiltro(f)}>
              {{ todas: 'Todas', pendente: 'Pendentes', entregue: 'Entregues', atrasado: 'Atrasadas', recusada: 'Recusadas' }[f]}
              <span style={{ fontSize: 10, color: 'var(--s400)', marginLeft: 3 }}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="search-wrap">
          <IconSearch size={15} />
          <input className="finput search-input" placeholder="Buscar…" style={{ width: 220 }} value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="empty-state"><h3>Nenhuma {rotulo.toLowerCase()} encontrada</h3><p>Tente outro filtro ou busca.</p></div>
      ) : filtradas.map((a) => {
        const variant = STATUS_VARIANT[a.status];
        const roster = podeGerenciar ? alunosDoItem(a) : [];
        const numRespostas = (respostasPorItem[a.id] ?? []).length;
        const numAbriram = roster.filter(r => r.entrega?.visto_em).length;
        return (
          <div
            key={a.id} className="card" style={{ marginBottom: '0.9rem', cursor: 'pointer' }}
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
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge variant={GRAU_VARIANT[a.grau]}>{GRAU_LABEL[a.grau]}</Badge>
                    {podeGerenciar && roster.length > 0 && <Badge variant="slate"><IconEyeCheck size={11} /> {numAbriram}/{roster.length} abriram</Badge>}
                    {!isAluno && <Badge variant="slate">{numRespostas} resposta{numRespostas === 1 ? '' : 's'}</Badge>}
                    {isAluno && <Badge variant={variant}>{STATUS_LABEL[a.status]}</Badge>}
                    {podeGerenciar && (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--re700)' }} onClick={(e) => { e.stopPropagation(); setExcluindo(a); }}>
                        <IconTrash size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 9, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--s400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconCalendar size={13} /> {new Date(`${a.prazo}T12:00:00`).toLocaleDateString('pt-BR')}
                    {' '}(+{DIAS_TOLERANCIA[a.grau]}d tolerância)
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--s400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconStar size={13} /> {a.pontos.toFixed(1)} pontos
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
                <Badge variant={GRAU_VARIANT[selecionada.grau]}>{GRAU_LABEL[selecionada.grau]}</Badge>
                {isAluno && <Badge variant={STATUS_VARIANT[selecionada.status]}>{STATUS_LABEL[selecionada.status]}</Badge>}
              </div>
              <p style={{ fontSize: 14, color: 'var(--s600)', lineHeight: 1.75, marginBottom: '1.3rem' }}>{selecionada.descricao}</p>
              <div className="form-grid-2" style={{ marginBottom: '1.3rem' }}>
                {[['Prazo', fmtData(selecionada.prazo)], ['Valor', `${selecionada.pontos.toFixed(1)} pontos`]].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--s50)', borderRadius: 10, padding: 11 }}>
                    <div style={{ fontSize: 10, color: 'var(--s400)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* ALUNO */}
              {isAluno && (
                <div style={{ borderTop: '1px solid var(--s100)', paddingTop: '1.2rem' }}>
                  {selecionada.status === 'recusada' && (() => {
                    const minhaEntrega = (respostasPorItem[selecionada.id] ?? []).find((e: any) => e.aluno_id === alunoId);
                    return minhaEntrega?.motivo_recusa ? (
                      <div style={{ background: 'var(--re50)', border: '1px solid var(--re100)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--re700)', marginBottom: '1rem' }}>
                        <strong>Sua entrega foi recusada:</strong> {minhaEntrega.motivo_recusa}<br />
                        <span style={{ fontSize: 12 }}>Reenvie uma correção abaixo — essa é sua segunda chance.</span>
                      </div>
                    ) : null;
                  })()}
                  <label className="flabel">
                    {selecionada.status === 'entregue' ? 'Sua resposta (você já enviou — pode reenviar pra atualizar)' : 'Sua resposta'}
                  </label>
                  <textarea className="finput" style={{ minHeight: 90 }} placeholder="Escreva sua resposta aqui…" value={resposta} onChange={(e) => setResposta(e.target.value)} />
                  <label className="flabel" style={{ marginTop: 10, display: 'block' }}>Foto (opcional)</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
                    onDragLeave={() => setArrastando(false)}
                    onDrop={(e) => { e.preventDefault(); setArrastando(false); selecionarImagem(e.dataTransfer.files[0]); }}
                    onClick={() => document.getElementById('input-foto-resposta')?.click()}
                    className="drop-zone"
                    style={{ padding: previewImagem ? 10 : '1.2rem' }}
                  >
                    <input id="input-foto-resposta" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => selecionarImagem(e.target.files?.[0])} />
                    {previewImagem ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={previewImagem} alt="Pré-visualização" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }} />
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--s800)' }}>{imagem?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--s400)' }}>Toque pra trocar a foto</div>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setImagem(null); setPreviewImagem(null); }} className="btn btn-ghost btn-sm"><IconX size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <IconFileUpload size={22} style={{ color: 'var(--s400)', marginBottom: 5 }} />
                        <div style={{ fontSize: 12.5, color: 'var(--s500)' }}>Arraste uma foto aqui ou clique para escolher</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* GESTOR */}
              {podeGerenciar && (
                <div style={{ borderTop: '1px solid var(--s100)', paddingTop: '1.2rem' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--s700)', marginBottom: 10 }}>
                    Alunos da turma ({alunosDoItem(selecionada).length})
                  </div>
                  {alunosDoItem(selecionada).length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--s400)' }}>Nenhum aluno matriculado nas turmas desta {rotulo.toLowerCase()}.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                      {alunosDoItem(selecionada).map(({ aluno, entrega }) => (
                        <div key={aluno.id} style={{ background: 'var(--s50)', borderRadius: 10, padding: 11 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                              <StatusDotSimples lastSeen={presenca[aluno.id]?.last_seen ?? null} />
                              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--s800)' }}>{aluno.nome}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                              {entrega?.visto_em ? (
                                <Badge variant="slate"><IconEyeCheck size={11} /> Abriu {fmtDataHora(entrega.visto_em)}</Badge>
                              ) : (
                                <Badge variant="amber"><IconEyeOff size={11} /> Não abriu</Badge>
                              )}
                              <Badge variant={entrega ? STATUS_VARIANT[entrega.status as StatusEntrega] : 'slate'}>
                                {entrega ? STATUS_LABEL[entrega.status as StatusEntrega] : 'Pendente'}
                              </Badge>
                              {entrega?.nota_obtida != null && (
                                <Badge variant={entrega.nota_obtida >= selecionada.pontos ? 'green' : entrega.nota_obtida > 0 ? 'amber' : 'red'}>
                                  {Number(entrega.nota_obtida).toFixed(1)}/{selecionada.pontos.toFixed(1)}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {entrega?.resposta && <p style={{ fontSize: 12.5, color: 'var(--s600)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: 8 }}>{entrega.resposta}</p>}
                          {entrega?.arquivo_url && (
                            <a href={entrega.arquivo_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6 }}>
                              <img src={entrega.arquivo_url} alt="Anexo do aluno" style={{ maxWidth: 140, maxHeight: 100, borderRadius: 8, border: '1px solid var(--s200)', objectFit: 'cover' }} />
                            </a>
                          )}

                          {entrega?.status === 'recusada' && entrega.motivo_recusa && (
                            <div style={{ fontSize: 12, color: 'var(--re700)', marginTop: 8 }}>Motivo da recusa: {entrega.motivo_recusa}</div>
                          )}

                          {/* Ações do professor */}
                          <div style={{ marginTop: 9, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {entrega?.status === 'entregue' && recusandoAlunoId !== aluno.id && (
                              <button className="btn btn-outline btn-sm" style={{ color: 'var(--re700)' }} onClick={() => { setRecusandoAlunoId(aluno.id); setMotivoRecusa(''); }}>
                                <IconThumbDown size={13} /> Recusar
                              </button>
                            )}
                            {entrega?.status === 'recusada' && (
                              <button className="btn btn-outline btn-sm" style={{ color: 'var(--re700)' }} onClick={() => emitirFichaPorNaoEntrega(aluno.id, aluno.nome, selecionada.titulo)}>
                                <IconFlag3 size={13} /> Emitir ficha
                              </button>
                            )}
                          </div>

                          {recusandoAlunoId === aluno.id && (
                            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                              <input className="finput" style={{ fontSize: 12.5, padding: '6px 10px' }} placeholder="Motivo da recusa…" value={motivoRecusa} onChange={(e) => setMotivoRecusa(e.target.value)} />
                              <button className="btn btn-danger btn-sm" onClick={() => recusarEntrega(entrega.id)}>Confirmar</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setRecusandoAlunoId(null)}>Cancelar</button>
                            </div>
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
                <button className="btn btn-primary" disabled={enviando} onClick={() => enviarResposta(selecionada)}>
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
        <NovaTarefaModal open={modalNova} onClose={() => setModalNova(false)} disciplinas={disciplinas} turmas={turmas} professorId={alunoId} modo={modo} />
      )}

      {excluindo && (
        <div style={modalOverlayStyle} onClick={() => setExcluindo(null)}>
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.4rem', borderBottom: '1px solid var(--s100)' }}><h2 style={{ fontSize: 17, fontWeight: 600 }}>Excluir {rotulo.toLowerCase()}</h2></div>
            <div style={{ padding: '1.4rem', fontSize: 14, color: 'var(--s600)' }}>
              Tem certeza que deseja excluir <strong>{excluindo.titulo}</strong>? As respostas dos alunos também serão apagadas.
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
  background: '#fff', borderRadius: 24, boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto',
};
