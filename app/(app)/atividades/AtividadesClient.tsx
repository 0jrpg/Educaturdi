'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch, IconCalendar, IconStar, IconX, IconUpload, IconPlus } from '@tabler/icons-react';
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

export default function AtividadesClient({
  atividades, disciplinas, turmas, isAluno, turma, alunoId,
}: {
  atividades: AtividadeComStatus[];
  disciplinas: Disciplina[];
  turmas: Turma[];
  isAluno: boolean;
  turma: string | null;
  alunoId: string;
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<'todas' | StatusAtividade>('todas');
  const [busca, setBusca] = useState('');
  const [selecionada, setSelecionada] = useState<AtividadeComStatus | null>(null);
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

  async function entregar(atividadeId: string) {
    setEnviando(true);
    const { error } = await supabase
      .from('entregas')
      .upsert({ atividade_id: atividadeId, aluno_id: alunoId, status: 'entregue', entregue_em: new Date().toISOString() }, { onConflict: 'atividade_id,aluno_id' });
    setEnviando(false);

    if (error) {
      showToast('Erro ao registrar entrega: ' + error.message, 'error');
      return;
    }
    showToast('Atividade marcada como entregue!', 'success');
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
        {!isAluno && (
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
        return (
          <div
            key={a.id}
            className="card"
            style={{ marginBottom: '0.9rem', cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
            onClick={() => setSelecionada(a)}
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
                  <Badge variant={variant}>{txt}</Badge>
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
          <div className="modal" style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem', borderBottom: '1px solid var(--s100)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>{selecionada.titulo}</h2>
              <button className="btn btn-ghost" onClick={() => setSelecionada(null)}><IconX size={18} /></button>
            </div>
            <div style={{ padding: '1.4rem' }}>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: '1.1rem' }}>
                <Badge variant="blue">{selecionada.disciplina}</Badge>
                <Badge variant="slate">Turmas: {selecionada.turmas.join(', ')}</Badge>
                <Badge variant={selecionada.status === 'entregue' ? 'green' : selecionada.status === 'atrasado' ? 'red' : 'amber'}>
                  {{ pendente: 'Pendente', entregue: 'Entregue', atrasado: 'Atrasada' }[selecionada.status]}
                </Badge>
              </div>
              <p style={{ fontSize: 14, color: 'var(--s600)', lineHeight: 1.75, marginBottom: '1.3rem' }}>
                {selecionada.descricao}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Prazo', fmtData(selecionada.prazo)], ['Valor', `${selecionada.pontos} pontos`]].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--s50)', borderRadius: 10, padding: 11 }}>
                    <div style={{ fontSize: 10, color: 'var(--s400)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '1.1rem 1.4rem', borderTop: '1px solid var(--s100)', display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
              {isAluno && selecionada.status !== 'entregue' && (
                <button className="btn btn-primary" disabled={enviando} onClick={() => entregar(selecionada.id)}>
                  <IconUpload size={16} /> {enviando ? 'Enviando...' : 'Marcar como entregue'}
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setSelecionada(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {!isAluno && (
        <NovaAtividadeModal
          open={modalNova}
          onClose={() => setModalNova(false)}
          disciplinas={disciplinas}
          turmas={turmas}
          professorId={alunoId}
        />
      )}
    </div>
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,.5)',
  backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
};
const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 24, boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
};
