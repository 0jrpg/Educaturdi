'use client';

import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import Badge from '@/components/Badge';
import NovoComunicadoModal from '@/components/forms/NovoComunicadoModal';
import type { Comunicado, Prioridade } from '@/types/database';

const EMOJI: Record<string, string> = { Acadêmico: '📚', Evento: '🎉', Saúde: '💉', Sistema: '🔧' };
const PRIOR_VARIANT: Record<Prioridade, 'red' | 'blue' | 'slate'> = { alta: 'red', normal: 'blue', baixa: 'slate' };
const PRIOR_LABEL: Record<Prioridade, string> = { alta: 'Urgente', normal: 'Normal', baixa: 'Informativo' };

export default function ComunicadosClient({
  comunicados, podeGerenciar, autorId,
}: { comunicados: Comunicado[]; podeGerenciar: boolean; autorId: string }) {
  const [catAtiva, setCatAtiva] = useState('Todos');
  const [modalNovo, setModalNovo] = useState(false);
  const categorias = ['Todos', ...new Set(comunicados.map(c => c.categoria))];
  const filtrados = catAtiva === 'Todos' ? comunicados : comunicados.filter(c => c.categoria === catAtiva);

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
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Badge variant="slate">{c.categoria}</Badge>
                    <Badge variant={PRIOR_VARIANT[c.prioridade]}>{PRIOR_LABEL[c.prioridade]}</Badge>
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
    </div>
  );
}
