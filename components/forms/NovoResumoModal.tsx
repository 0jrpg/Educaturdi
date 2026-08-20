'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { CDN_BASE_URL, montarUrlCdn } from '@/lib/config';
import { IconFileUpload, IconFileText, IconX } from '@tabler/icons-react';
import type { Disciplina, Turma } from '@/types/database';

const TIPOS_ACEITOS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function extensao(nome: string) {
  return nome.split('.').pop()?.toLowerCase() ?? '';
}

export default function NovoResumoModal({
  open, onClose, disciplinas, turmas, professorId,
}: {
  open: boolean;
  onClose: () => void;
  disciplinas: Disciplina[];
  turmas: Turma[];
  professorId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [disciplina, setDisciplina] = useState(disciplinas[0]?.nome ?? '');
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<string[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [codigoCdn, setCodigoCdn] = useState('');
  const [extCdn, setExtCdn] = useState('.pdf');
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  function toggleTurma(id: string) {
    setTurmasSelecionadas((cur) => cur.includes(id) ? cur.filter(t => t !== id) : [...cur, id]);
  }

  function selecionarArquivo(file: File | undefined) {
    if (!file) return;
    const ext = extensao(file.name);
    if (!TIPOS_ACEITOS.includes(file.type) && !['pdf', 'doc', 'docx'].includes(ext)) {
      showToast('Envie um arquivo em PDF ou Word (.doc/.docx).', 'error');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      showToast('O arquivo precisa ter no máximo 25 MB.', 'error');
      return;
    }
    setArquivo(file);
    setCodigoCdn('');
    if (!titulo) setTitulo(file.name.replace(/\.(pdf|docx?|)$/i, ''));
  }

  function limpar() {
    setTitulo(''); setDescricao(''); setTurmasSelecionadas([]); setArquivo(null); setCodigoCdn(''); setExtCdn('.pdf'); setProgresso(0);
  }

  async function salvar() {
    if (!titulo.trim()) return showToast('Dê um título para o resumo.', 'error');
    if (!turmasSelecionadas.length) return showToast('Selecione ao menos uma turma.', 'error');
    if (!arquivo && !codigoCdn.trim()) {
      return showToast('Envie um arquivo ou informe o código do link da CDN.', 'error');
    }

    setEnviando(true);
    setProgresso(10);

    try {
      let arquivoUrl: string;
      let tipoArquivo: string;

      if (arquivo) {
        const ext = extensao(arquivo.name);
        const nomeArquivo = `${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('resumos')
          .upload(nomeArquivo, arquivo, { contentType: arquivo.type || undefined });
        if (uploadError) throw new Error(uploadError.message);
        setProgresso(70);
        const { data: urlData } = supabase.storage.from('resumos').getPublicUrl(nomeArquivo);
        arquivoUrl = urlData.publicUrl;
        tipoArquivo = ext;
      } else {
        arquivoUrl = montarUrlCdn(`${codigoCdn.trim()}${extCdn}`);
        tipoArquivo = extCdn.replace('.', '');
        setProgresso(70);
      }

      const { error: insertError } = await supabase.from('resumos').insert({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        disciplina,
        professor_id: professorId,
        turmas: turmasSelecionadas,
        tipo_arquivo: tipoArquivo,
        arquivo_url: arquivoUrl,
        tamanho_kb: arquivo ? Math.round(arquivo.size / 1024) : null,
      });

      if (insertError) throw new Error(insertError.message);
      setProgresso(100);

      showToast('Resumo enviado com sucesso!', 'success');
      limpar();
      onClose();
      router.refresh();
    } catch (e: any) {
      showToast('Erro ao enviar: ' + e.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo Resumo"
      footer={
        <>
          <button className="btn btn-primary" disabled={enviando} onClick={salvar}>
            {enviando ? `Enviando... ${progresso}%` : 'Enviar Resumo'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        </>
      }
    >
      {/* Opção 1 — upload direto */}
      <div
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          selecionarArquivo(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${arrastando ? 'var(--g500)' : 'var(--s300)'}`,
          borderRadius: 14,
          padding: '1.6rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: arrastando ? 'var(--g50)' : 'var(--s50)',
          marginBottom: '1rem',
          transition: 'all .15s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: 'none' }}
          onChange={(e) => selecionarArquivo(e.target.files?.[0])}
        />
        {arquivo ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <IconFileText size={28} style={{ color: 'var(--g600)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--s800)' }}>{arquivo.name}</div>
              <div style={{ fontSize: 11, color: 'var(--s400)' }}>{(arquivo.size / 1024 / 1024).toFixed(1)} MB</div>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); setArquivo(null); }} className="btn btn-ghost btn-sm">
              <IconX size={14} />
            </button>
          </div>
        ) : (
          <>
            <IconFileUpload size={28} style={{ color: 'var(--s400)', marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: 'var(--s500)' }}>Arraste o PDF ou Word aqui ou clique para escolher</div>
            <div style={{ fontSize: 11, color: 'var(--s400)', marginTop: 3 }}>PDF, DOC ou DOCX · Máximo 25 MB</div>
          </>
        )}
      </div>

      {/* Divisor "Ou" */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1rem 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--s200)' }} />
        <span style={{ fontSize: 11.5, color: 'var(--s400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ou</span>
        <div style={{ flex: 1, height: 1, background: 'var(--s200)' }} />
      </div>

      {/* Opção 2 — link da CDN */}
      <div className="fg">
        <label className="flabel">Link do arquivo na sua CDN</label>
        <div
          style={{
            display: 'flex', alignItems: 'stretch', borderRadius: 12,
            border: `1.5px solid ${arquivo ? 'var(--s100)' : 'var(--s200)'}`, overflow: 'hidden', background: arquivo ? 'var(--s50)' : '#fff',
          }}
        >
          <span
            style={{
              display: 'flex', alignItems: 'center', padding: '0 10px',
              background: 'var(--s50)', color: 'var(--s500)', fontSize: 12, fontWeight: 500,
              borderRight: '1.5px solid var(--s200)', whiteSpace: 'nowrap',
            }}
          >
            https://{CDN_BASE_URL}/
          </span>
          <input
            className="finput"
            style={{ border: 'none', borderRadius: 0, flex: 1, minWidth: 0, padding: '0 8px' }}
            placeholder="Digite aqui o código"
            value={codigoCdn}
            disabled={!!arquivo}
            onChange={(e) => setCodigoCdn(e.target.value)}
          />
          <select
            value={extCdn}
            disabled={!!arquivo}
            onChange={(e) => setExtCdn(e.target.value)}
            style={{
              border: 'none', borderLeft: '1.5px solid var(--s200)', background: 'transparent',
              color: 'var(--s600)', fontSize: 12.5, fontWeight: 600, padding: '0 8px',
            }}
          >
            <option value=".pdf">.pdf</option>
            <option value=".doc">.doc</option>
            <option value=".docx">.docx</option>
          </select>
        </div>
        <div style={{ fontSize: 11, color: 'var(--s400)', marginTop: 5 }}>
          Cole só o código do arquivo que você já hospedou — o resto do link é montado automaticamente.
        </div>
      </div>

      <div className="fg">
        <label className="flabel">Título</label>
        <input className="finput" placeholder="Ex: Resumo — Revolução Francesa" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>

      <div className="fg">
        <label className="flabel">Descrição</label>
        <textarea className="finput" placeholder="Sobre o que é esse resumo…" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>

      <div className="fg">
        <label className="flabel">Disciplina</label>
        <select className="finput" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
          {disciplinas.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
        </select>
      </div>

      <div className="fg" style={{ marginBottom: 0 }}>
        <label className="flabel">Turmas</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {turmas.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => toggleTurma(t.id)}
              className="badge"
              style={{
                cursor: 'pointer', padding: '6px 14px', fontSize: 13,
                background: turmasSelecionadas.includes(t.id) ? 'var(--g500)' : 'var(--s100)',
                color: turmasSelecionadas.includes(t.id) ? '#fff' : 'var(--s600)',
              }}
            >
              {t.id}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
