'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import type { Prioridade } from '@/types/database';

const CATEGORIAS = ['Acadêmico', 'Evento', 'Saúde', 'Sistema', 'Geral'];

export default function NovoComunicadoModal({
  open, onClose, autorId,
}: { open: boolean; onClose: () => void; autorId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [prioridade, setPrioridade] = useState<Prioridade>('normal');
  const [salvando, setSalvando] = useState(false);

  function limpar() {
    setTitulo(''); setConteudo(''); setCategoria(CATEGORIAS[0]); setPrioridade('normal');
  }

  async function salvar() {
    if (!titulo.trim()) return showToast('Dê um título ao comunicado.', 'error');
    if (!conteudo.trim()) return showToast('Escreva o conteúdo do comunicado.', 'error');

    setSalvando(true);
    const { error } = await supabase.from('comunicados').insert({
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      categoria,
      prioridade,
      autor_id: autorId,
    });
    setSalvando(false);

    if (error) { showToast('Erro ao publicar: ' + error.message, 'error'); return; }

    showToast('Comunicado publicado!', 'success');
    limpar();
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo Comunicado"
      footer={
        <>
          <button className="btn btn-primary" disabled={salvando} onClick={salvar}>
            {salvando ? 'Publicando...' : 'Publicar Comunicado'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        </>
      }
    >
      <div className="fg">
        <label className="flabel">Título</label>
        <input className="finput" placeholder="Ex: Calendário de Provas" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>

      <div className="fg">
        <label className="flabel">Conteúdo</label>
        <textarea className="finput" style={{ minHeight: 120 }} placeholder="Escreva o comunicado completo…" value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="fg" style={{ marginBottom: 0 }}>
          <label className="flabel">Categoria</label>
          <select className="finput" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="fg" style={{ marginBottom: 0 }}>
          <label className="flabel">Prioridade</label>
          <select className="finput" value={prioridade} onChange={(e) => setPrioridade(e.target.value as Prioridade)}>
            <option value="alta">Urgente</option>
            <option value="normal">Normal</option>
            <option value="baixa">Informativo</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
