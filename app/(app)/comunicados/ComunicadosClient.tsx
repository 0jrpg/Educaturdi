'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import Badge from '@/components/Badge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import NovoComunicadoModal from '@/components/forms/NovoComunicadoModal';
import type { Comunicado, Prioridade } from '@/types/database';

const EMOJI: Record<string, string> = { Acadêmico: '📚', Evento: '🎉', Saúde: '💉', Sistema: '🔧' };
const PRIOR_VARIANT: Record<Prioridade, 'red' | 'blue' | 'slate'> = { alta: 'red', normal: 'blue', baixa: 'slate' };
const PRIOR_LABEL: Record<Prioridade, string> = { alta: 'Urgente', normal: 'Normal', baixa: 'Informativo' };

export default function ComunicadosClient({
  comunicados, podeGerenciar, autorId,
}: { comunicados: Comunicado[]; podeGerenciar: boolean; autorId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [catAtiva, setCatAtiva] = useState('Todos');
  const [modalNovo, setModalNovo] = useState(false);
  const [excluindo, setExcluindo] = useState<Comunicado | null>(null);
  const categorias = ['Todos', ...new Set(comunicados.map(c => c.categoria))];
  const filtrados = catAtiva === 'Todos' ? comunicados : comunicados.filter(c => c.categoria === catAtiva);

  async function confirmarExclusao() {
    if (!excluindo) return;
    const { error } = await supabase.from('comunicados').delete().eq('id', excluindo.id);
    if (error) {
      showToast('Erro ao excluir: ' + error.message, 'error');
      return;
    }
    showToast('Comunicado excluído.', 'success');
    setExcluindo(null);
    router.refresh();
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Comunicados</h1><p>Avisos e informações da escola</p></div>
        {podeGerenciar && (
          <button className="btn btn-primary" onClick={() => setModalNovo(true)}>
            <IconPlus size={16} /> Novo Comunicado
          </button>
        )}
      </div>

      <div className="tabs">
        {categorias.map((c) => (
          <button key={c} className={`tab-btn ${catAtiva === c ? 'active' : ''}`} onClick={() => setCatAtiva(c)}>{c}</button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="empty-state"><h3>Nenhum comunicado ainda</h3></div>
      ) : filtrados.map((c) => (
        <div key={c.id} className="card" style={{ marginBottom: '0.9rem' }}>
          <div style={{ padding: '1.3rem' }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ fontSize: 30, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{EMOJI[c.categoria] ?? '📢'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 11, marginBottom: 7, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--s900)' }}>{c.titulo}</h3>
                    <div style={{ fontSize: 11, color: 'var(--s400)', marginTop: 2 }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    <Badge variant="slate">{c.categoria}</Badge>
                    <Badge variant={PRIOR_VARIANT[c.prioridade]}>{PRIOR_LABEL[c.prioridade]}</Badge>
                    {podeGerenciar && (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--re700)' }} onClick={() => setExcluindo(c)}>
                        <IconTrash size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--s500)', lineHeight: 1.75 }}>{c.conteudo}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {podeGerenciar && (
        <NovoComunicadoModal open={modalNovo} onClose={() => setModalNovo(false)} autorId={autorId} />
      )}

      {excluindo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setExcluindo(null)}>
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.4rem', borderBottom: '1px solid var(--s100)' }}><h2 style={{ fontSize: 17, fontWeight: 600 }}>Excluir comunicado</h2></div>
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
