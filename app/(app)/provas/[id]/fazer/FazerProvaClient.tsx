'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  IconClockHour4, IconAlertTriangle, IconPlayerPlay, IconCheck, IconFileUpload,
  IconX, IconSend, IconArrowLeft,
} from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import { usePresenceContext } from '@/components/PresenceProvider';
import {
  calcularSegundosRestantes, formatarTempo, iniciarTentativa, aplicarPenalidade, salvarResposta, finalizarTentativa,
  PENALIDADE_MINUTOS,
} from '@/lib/provas';
import type { Prova, ProvaTentativa } from '@/types/database';

const CHAVE_SAIU = (tentativaId: string) => `prova_saiu_${tentativaId}`;

export default function FazerProvaClient({
  prova, tentativaInicial, alunoId,
}: { prova: Prova; tentativaInicial: ProvaTentativa | null; alunoId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();
  const definirContexto = usePresenceContext();

  const [tentativa, setTentativa] = useState<ProvaTentativa | null>(tentativaInicial);
  const [segundos, setSegundos] = useState(tentativaInicial ? calcularSegundosRestantes(tentativaInicial.termina_em) : prova.duracao_minutos * 60);
  const [resposta, setResposta] = useState(tentativaInicial?.resposta ?? '');
  const [imagem, setImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(tentativaInicial?.arquivo_url ?? null);
  const [arrastando, setArrastando] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const respostaRef = useRef(resposta);
  respostaRef.current = resposta;
  const tentativaRef = useRef(tentativa);
  tentativaRef.current = tentativa;

  const finalizada = !!tentativa?.finalizada_em || (tentativa != null && segundos <= 0);

  // Anuncia no sistema de presença que o aluno está fazendo a prova.
  useEffect(() => {
    if (tentativa && !finalizada) {
      definirContexto({ tipo: 'prova', titulo: prova.titulo });
      return () => definirContexto(null);
    }
  }, [tentativa, finalizada, definirContexto, prova.titulo]);

  // ── Cronômetro ──────────────────────────────────────────────
  useEffect(() => {
    if (!tentativa || tentativa.finalizada_em) return;
    const interval = setInterval(() => {
      setSegundos(calcularSegundosRestantes(tentativa.termina_em));
    }, 1000);
    return () => clearInterval(interval);
  }, [tentativa]);

  // Quando o tempo zera, finaliza automaticamente (só uma vez).
  useEffect(() => {
    if (tentativa && !tentativa.finalizada_em && segundos <= 0) {
      finalizarTentativa(supabase, tentativa.id).then(() => {
        setTentativa((t) => t ? { ...t, finalizada_em: new Date().toISOString() } : t);
        showToast('Tempo esgotado! A prova foi enviada automaticamente.', 'warning');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundos, tentativa?.id, tentativa?.finalizada_em]);

  // ── Autosave da resposta a cada 12s ─────────────────────────
  useEffect(() => {
    if (!tentativa || finalizada) return;
    const interval = setInterval(() => {
      salvarResposta(supabase, tentativa.id, respostaRef.current);
    }, 12_000);
    return () => clearInterval(interval);
  }, [tentativa, finalizada, supabase]);

  // ── Anti-cola: sair da aba/navegar embora desconta 5 minutos ─
  const aplicarPenalidadeSeVoltou = useCallback(async () => {
    const t = tentativaRef.current;
    if (!t || t.finalizada_em) return;
    const chave = CHAVE_SAIU(t.id);
    const saiuEm = sessionStorage.getItem(chave);
    if (!saiuEm) return;
    sessionStorage.removeItem(chave);

    const { expirou, tentativa: atualizada } = await aplicarPenalidade(supabase, t.id, t.termina_em, t.penalidades);
    if (atualizada) setTentativa(atualizada as ProvaTentativa);
    if (expirou) {
      showToast('Você saiu da prova e o tempo acabou. Ela foi enviada automaticamente.', 'error');
    } else {
      showToast(`Você saiu da prova! ${PENALIDADE_MINUTOS} minutos foram descontados.`, 'error');
    }
  }, [supabase, showToast]);

  useEffect(() => {
    if (!tentativa || finalizada) return;

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        sessionStorage.setItem(CHAVE_SAIU(tentativaRef.current!.id), String(Date.now()));
      } else if (document.visibilityState === 'visible') {
        aplicarPenalidadeSeVoltou();
      }
    }
    // Também checa assim que a página monta (caso tenha saído e voltado
    // através de um recarregamento completo, não só troca de aba).
    aplicarPenalidadeSeVoltou();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', () => sessionStorage.setItem(CHAVE_SAIU(tentativaRef.current!.id), String(Date.now())));
    window.addEventListener('focus', aplicarPenalidadeSeVoltou);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', aplicarPenalidadeSeVoltou);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativa?.id, finalizada]);

  async function comecar() {
    setIniciando(true);
    const { data, error } = await iniciarTentativa(supabase, prova.id, alunoId, prova.duracao_minutos);
    setIniciando(false);
    if (error) return showToast('Erro ao iniciar: ' + error.message, 'error');
    setTentativa(data as ProvaTentativa);
    setSegundos(prova.duracao_minutos * 60);
  }

  function selecionarImagem(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('Envie uma imagem.', 'error');
    if (file.size > 10 * 1024 * 1024) return showToast('Máximo 10 MB.', 'error');
    setImagem(file);
    setPreviewImagem(URL.createObjectURL(file));
  }

  async function enviarFinal() {
    if (!tentativa) return;
    setEnviando(true);
    try {
      let arquivoUrl: string | undefined;
      if (imagem) {
        const nomeArquivo = `${alunoId}/${Date.now()}-${imagem.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('entregas-anexos').upload(nomeArquivo, imagem, { contentType: imagem.type });
        if (uploadError) throw new Error(uploadError.message);
        const { data: urlData } = supabase.storage.from('entregas-anexos').getPublicUrl(nomeArquivo);
        arquivoUrl = urlData.publicUrl;
      }
      await salvarResposta(supabase, tentativa.id, resposta, arquivoUrl);
      await finalizarTentativa(supabase, tentativa.id);
      setTentativa({ ...tentativa, finalizada_em: new Date().toISOString(), resposta, arquivo_url: arquivoUrl ?? tentativa.arquivo_url });
      showToast('Prova enviada! Aguarde a correção do professor.', 'success');
    } catch (e: any) {
      showToast('Erro ao enviar: ' + e.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  // ── TELA: nunca iniciou ──────────────────────────────────────
  if (!tentativa) {
    const disponivelVenceu = prova.disponivel_ate && new Date(prova.disponivel_ate).getTime() < Date.now();
    return (
      <div style={{ maxWidth: 560, margin: '2rem auto' }}>
        <Link href="/provas" className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}><IconArrowLeft size={14} /> Voltar</Link>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--am100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
            <IconClockHour4 size={28} style={{ color: 'var(--am700)' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{prova.titulo}</h1>
          <p style={{ fontSize: 13, color: 'var(--s500)', marginBottom: '1.4rem' }}>{prova.disciplina} · {prova.duracao_minutos} minutos · {prova.pontos.toFixed(1)} pontos</p>

          {prova.descricao && <p style={{ fontSize: 13.5, color: 'var(--s600)', lineHeight: 1.7, marginBottom: '1.4rem', textAlign: 'left', background: 'var(--s50)', padding: '1rem', borderRadius: 12 }}>{prova.descricao}</p>}

          <div style={{ background: 'var(--re50)', border: '1px solid var(--re100)', borderRadius: 12, padding: '1rem', marginBottom: '1.4rem', textAlign: 'left', display: 'flex', gap: 10 }}>
            <IconAlertTriangle size={20} style={{ color: 'var(--re700)', flexShrink: 0 }} />
            <div style={{ fontSize: 12.5, color: 'var(--re700)', lineHeight: 1.6 }}>
              Assim que você clicar em <strong>Iniciar Prova</strong>, o cronômetro de {prova.duracao_minutos} minutos começa
              e <strong>não pode ser pausado</strong>. Se você sair da aba, trocar de aplicativo ou navegar pra outra página
              do site, {PENALIDADE_MINUTOS} minutos serão descontados automaticamente.
            </div>
          </div>

          {disponivelVenceu ? (
            <div className="badge br" style={{ fontSize: 13, padding: '8px 16px' }}>O prazo para iniciar esta prova já encerrou</div>
          ) : (
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={iniciando} onClick={comecar}>
              <IconPlayerPlay size={18} /> {iniciando ? 'Iniciando...' : 'Iniciar Prova'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── TELA: finalizada ─────────────────────────────────────────
  if (finalizada) {
    return (
      <div style={{ maxWidth: 560, margin: '2rem auto' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--g100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
            <IconCheck size={28} style={{ color: 'var(--g700)' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Prova enviada!</h1>
          <p style={{ fontSize: 13.5, color: 'var(--s500)', marginBottom: '1.4rem' }}>
            {tentativa.nota_obtida != null ? `Nota: ${tentativa.nota_obtida.toFixed(1)} de ${prova.pontos.toFixed(1)}` : 'Aguardando correção do professor.'}
          </p>
          {tentativa.penalidades > 0 && (
            <div className="badge ba" style={{ marginBottom: '1.2rem' }}>{tentativa.penalidades} penalidade(s) por sair da prova</div>
          )}
          <Link href="/provas" className="btn btn-outline"><IconArrowLeft size={14} /> Voltar pra Provas</Link>
        </div>
      </div>
    );
  }

  // ── TELA: em andamento ───────────────────────────────────────
  const critico = segundos <= 5 * 60;
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 10, background: critico ? 'var(--re50)' : '#fff',
          border: `1.5px solid ${critico ? 'var(--re100)' : 'var(--s200)'}`, borderRadius: 16,
          padding: '1rem 1.4rem', marginBottom: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: 'var(--sh-md)',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--s900)' }}>{prova.titulo}</div>
          <div style={{ fontSize: 12, color: 'var(--s400)' }}>{prova.disciplina}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: critico ? 'var(--re700)' : 'var(--g700)' }}>
            {formatarTempo(segundos)}
          </div>
          {tentativa.penalidades > 0 && <div style={{ fontSize: 11, color: 'var(--re700)' }}>−{tentativa.penalidades * PENALIDADE_MINUTOS} min por sair</div>}
        </div>
      </div>

      {prova.descricao && (
        <div className="card" style={{ padding: '1.2rem', marginBottom: '1.2rem' }}>
          <div style={{ fontSize: 11, color: 'var(--s400)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Enunciado</div>
          <p style={{ fontSize: 14, color: 'var(--s700)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{prova.descricao}</p>
        </div>
      )}

      <div className="card" style={{ padding: '1.2rem' }}>
        <label className="flabel">Sua resposta</label>
        <textarea className="finput" style={{ minHeight: 220 }} placeholder="Escreva sua resposta aqui…" value={resposta} onChange={(e) => setResposta(e.target.value)} />

        <label className="flabel" style={{ marginTop: 12, display: 'block' }}>Foto (opcional)</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => { e.preventDefault(); setArrastando(false); selecionarImagem(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById('input-foto-prova')?.click()}
          className="drop-zone"
          style={{ padding: previewImagem ? 10 : '1.2rem' }}
        >
          <input id="input-foto-prova" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => selecionarImagem(e.target.files?.[0])} />
          {previewImagem ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={previewImagem} alt="Pré-visualização" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }} />
              <div style={{ flex: 1, textAlign: 'left', fontSize: 12.5, color: 'var(--s500)' }}>Toque pra trocar a foto</div>
              <button type="button" onClick={(e) => { e.stopPropagation(); setImagem(null); setPreviewImagem(null); }} className="btn btn-ghost btn-sm"><IconX size={14} /></button>
            </div>
          ) : (
            <>
              <IconFileUpload size={22} style={{ color: 'var(--s400)', marginBottom: 5 }} />
              <div style={{ fontSize: 12.5, color: 'var(--s500)' }}>Arraste uma foto aqui ou clique para escolher</div>
            </>
          )}
        </div>

        <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1.2rem' }} disabled={enviando} onClick={enviarFinal}>
          <IconSend size={17} /> {enviando ? 'Enviando...' : 'Finalizar e Enviar Prova'}
        </button>
      </div>
    </div>
  );
}
