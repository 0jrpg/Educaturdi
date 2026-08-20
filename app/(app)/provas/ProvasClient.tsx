'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconPlus, IconTrash, IconClockHour4, IconCalendar, IconStar, IconPlayerPlay, IconCheck } from '@tabler/icons-react';
import Badge from '@/components/Badge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import NovaProvaModal from '@/components/forms/NovaProvaModal';
import type { Prova, Disciplina, Turma, ProvaTentativa } from '@/types/database';

function discCor(disciplinas: Disciplina[], nome: string) {
  return disciplinas.find(d => d.nome === nome)?.cor ?? '#64748b';
}

export default function ProvasClient({
  provas, disciplinas, turmas, isAluno, podeGerenciar, turma, professorId, minhasTentativas, tentativasPorProva,
}: {
  provas: Prova[]; disciplinas: Disciplina[]; turmas: Turma[]; isAluno: boolean; podeGerenciar: boolean;
  turma: string | null; professorId: string;
  minhasTentativas: Record<string, ProvaTentativa>;
  tentativasPorProva: Record<string, any[]>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();
  const [modalNova, setModalNova] = useState(false);
  const [excluindo, setExcluindo] = useState<Prova | null>(null);

  const base = isAluno ? provas.filter(p => p.turmas.includes(turma ?? '')) : provas;

  async function confirmarExclusao() {
    if (!excluindo) return;
    const { error } = await supabase.from('provas').delete().eq('id', excluindo.id);
    if (error) return showToast('Erro: ' + error.message, 'error');
    showToast('Prova excluída.', 'success');
    setExcluindo(null);
    router.refresh();
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Provas</h1><p>{isAluno ? `Turma ${turma}` : 'Todas as turmas'} · com tempo cronometrado</p></div>
        {podeGerenciar && (
          <button className="btn btn-primary" onClick={() => setModalNova(true)}><IconPlus size={16} /> Nova Prova</button>
        )}
      </div>

      {base.length === 0 ? (
        <div className="empty-state"><IconClockHour4 size={26} /><h3>Nenhuma prova por aqui</h3></div>
      ) : (
        <div className="grid-auto">
          {base.map((p) => {
            const tentativa = minhasTentativas[p.id];
            const jaFinalizou = tentativa?.finalizada_em;
            const tentativasGestor = tentativasPorProva[p.id] ?? [];
            const disponivelVenceu = p.disponivel_ate && new Date(p.disponivel_ate).getTime() < Date.now();

            return (
              <div key={p.id} className="card">
                <div style={{ padding: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: `${discCor(disciplinas, p.disciplina)}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconClockHour4 size={20} style={{ color: discCor(disciplinas, p.disciplina) }} />
                    </div>
                    {podeGerenciar && (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--re700)' }} onClick={() => setExcluindo(p)}><IconTrash size={14} /></button>
                    )}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--s900)', marginBottom: 4 }}>{p.titulo}</div>
                  <div style={{ fontSize: 12, color: 'var(--s400)', marginBottom: 10 }}>{p.disciplina} · Turmas: {p.turmas.join(', ')}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    <Badge variant="slate"><IconClockHour4 size={11} /> {p.duracao_minutos} min</Badge>
                    <Badge variant="slate"><IconStar size={11} /> {p.pontos.toFixed(1)} pts</Badge>
                    {p.disponivel_ate && <Badge variant={disponivelVenceu ? 'red' : 'amber'}><IconCalendar size={11} /> até {new Date(p.disponivel_ate).toLocaleDateString('pt-BR')}</Badge>}
                  </div>

                  {isAluno && (
                    jaFinalizou ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--g700)', fontWeight: 600 }}>
                        <IconCheck size={16} /> Finalizada
                        {tentativa.nota_obtida != null ? ` · ${tentativa.nota_obtida.toFixed(1)}/${p.pontos.toFixed(1)}` : ' · aguardando correção'}
                      </div>
                    ) : disponivelVenceu ? (
                      <Badge variant="red">Prazo encerrado</Badge>
                    ) : (
                      <Link href={`/provas/${p.id}/fazer`} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                        <IconPlayerPlay size={14} /> {tentativa ? 'Continuar Prova' : 'Iniciar Prova'}
                      </Link>
                    )
                  )}

                  {podeGerenciar && (
                    <div style={{ fontSize: 12.5, color: 'var(--s500)' }}>
                      {tentativasGestor.length} aluno{tentativasGestor.length === 1 ? '' : 's'} iniciaram · {tentativasGestor.filter(t => t.finalizada_em).length} finalizaram
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {podeGerenciar && (
        <NovaProvaModal open={modalNova} onClose={() => setModalNova(false)} disciplinas={disciplinas} turmas={turmas} professorId={professorId} />
      )}

      {excluindo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setExcluindo(null)}>
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: 'var(--sh-lg)', width: '100%', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.4rem', borderBottom: '1px solid var(--s100)' }}><h2 style={{ fontSize: 17, fontWeight: 600 }}>Excluir prova</h2></div>
            <div style={{ padding: '1.4rem', fontSize: 14, color: 'var(--s600)' }}>Tem certeza que deseja excluir <strong>{excluindo.titulo}</strong>? As tentativas dos alunos também serão apagadas.</div>
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
