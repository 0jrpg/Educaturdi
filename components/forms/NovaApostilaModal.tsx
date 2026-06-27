'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { IconFileUpload, IconFileText, IconX } from '@tabler/icons-react';
import type { Disciplina, Turma } from '@/types/database';

const EMOJIS = ['📄', '📐', '📝', '⚗️', '🧬', '🌍', '🔭', '📊', '🗺️', '📚'];

export default function NovaApostilaModal({
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
  const [emoji, setEmoji] = useState('📄');
  const [paginas, setPaginas] = useState<number | ''>('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  function toggleTurma(id: string) {
    setTurmasSelecionadas((cur) => cur.includes(id) ? cur.filter(t => t !== id) : [...cur, id]);
  }

  function selecionarArquivo(file: File | undefined) {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      showToast('Por favor, selecione um arquivo PDF.', 'error');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      showToast('O arquivo precisa ter no máximo 25 MB.', 'error');
      return;
    }
    setArquivo(file);
    if (!titulo) setTitulo(file.name.replace(/\.pdf$/i, ''));
  }

  function limpar() {
    setTitulo(''); setDescricao(''); setTurmasSelecionadas([]); setPaginas(''); setArquivo(null); setEmoji('📄'); setProgresso(0);
  }

  async function salvar() {
    if (!titulo.trim()) return showToast('Dê um título para a apostila.', 'error');
    if (!turmasSelecionadas.length) return showToast('Selecione ao menos uma turma.', 'error');
    if (!arquivo) return showToast('Selecione um arquivo PDF.', 'error');

    setEnviando(true);
    setProgresso(10);

    try {
      const nomeArquivo = `${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from('apostilas')
        .upload(nomeArquivo, arquivo, { contentType: 'application/pdf' });

      if (uploadError) throw new Error(uploadError.message);
      setProgresso(70);

      const { data: urlData } = supabase.storage.from('apostilas').getPublicUrl(nomeArquivo);

      const { error: insertError } = await supabase.from('apostilas').insert({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        disciplina,
        professor_id: professorId,
        turmas: turmasSelecionadas,
        paginas: paginas === '' ? null : paginas,
        emoji,
        arquivo_url: urlData.publicUrl,
        tamanho_kb: Math.round(arquivo.size / 1024),
      });

      if (insertError) throw new Error(insertError.message);
      setProgresso(100);

      showToast('Apostila enviada com sucesso!', 'success');
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
      title="Nova Apostila"
      footer={
        <>
          <button className="btn btn-primary" disabled={enviando} onClick={salvar}>
            {enviando ? `Enviando... ${progresso}%` : 'Enviar Apostila'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        </>
      }
    >
      {/* Drag and drop zone */}
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
          marginBottom: '1.2rem',
          transition: 'all .15s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
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
            <div style={{ fontSize: 13, color: 'var(--s500)' }}>Arraste o PDF aqui ou clique para escolher</div>
            <div style={{ fontSize: 11, color: 'var(--s400)', marginTop: 3 }}>Máximo 25 MB</div>
          </>
        )}
      </div>

      <div className="fg">
        <label className="flabel">Título</label>
        <input className="finput" placeholder="Ex: Apostila de Matemática Vol. 1" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>

      <div className="fg">
        <label className="flabel">Descrição</label>
        <textarea className="finput" placeholder="Sobre o que é esse material…" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="fg">
          <label className="flabel">Disciplina</label>
          <select className="finput" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
            {disciplinas.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
          </select>
        </div>
        <div className="fg">
          <label className="flabel">Páginas (opcional)</label>
          <input type="number" className="finput" min={1} value={paginas} onChange={(e) => setPaginas(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
      </div>

      <div className="fg">
        <label className="flabel">Ícone</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setEmoji(e)}
              style={{
                fontSize: 20, width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
                background: emoji === e ? 'var(--g100)' : 'var(--s100)',
                border: emoji === e ? '2px solid var(--g500)' : '2px solid transparent',
              }}
            >
              {e}
            </button>
          ))}
        </div>
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
