'use client';

import { useState } from 'react';
import Badge from '@/components/Badge';
import type { Nota, Disciplina } from '@/types/database';

function discCor(disciplinas: Disciplina[], nome: string) {
  return disciplinas.find(d => d.nome === nome)?.cor ?? '#64748b';
}
function media(n: Nota) {
  const b = [n.b1, n.b2, n.b3, n.b4].filter((v): v is number => v !== null);
  return b.length ? b.reduce((a, c) => a + c, 0) / b.length : null;
}

function BoletimTable({ turma, notas, disciplinas }: { turma: string; notas: Nota[]; disciplinas: Disciplina[] }) {
  if (!notas.length) {
    return <p style={{ color: 'var(--s400)', padding: '1rem' }}>Sem notas lançadas ainda para esta turma. Lance pelo Supabase Table Editor.</p>;
  }

  const medias = notas.map(media).filter((v): v is number => v !== null);
  const geral = medias.length ? (medias.reduce((a, b) => a + b, 0) / medias.length).toFixed(1) : '—';
  const fmt = (v: number | null) => v === null ? <span style={{ color: 'var(--s300)' }}>—</span> : <strong>{v.toFixed(1)}</strong>;

  return (
    <div>
      <div className="grid-4" style={{ marginBottom: '1.3rem' }}>
        <div className="stat-card"><div className="stat-lbl">Média Geral</div><div className="stat-val" style={{ color: 'var(--g600)' }}>{geral}</div></div>
        <div className="stat-card"><div className="stat-lbl">Aprovadas</div><div className="stat-val">{medias.filter(m => m >= 7).length}</div><div className="stat-sub">de {notas.length} disc.</div></div>
        <div className="stat-card"><div className="stat-lbl">Recuperação</div><div className="stat-val" style={{ color: 'var(--am700)' }}>{medias.filter(m => m >= 5 && m < 7).length}</div></div>
        <div className="stat-card"><div className="stat-lbl">Reprovadas</div><div className="stat-val" style={{ color: 'var(--re700)' }}>{medias.filter(m => m < 5).length}</div></div>
      </div>
      <div className="card">
        <div className="card-hd"><h3>Boletim — Turma {turma} · 1º Semestre 2026</h3></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Disciplina</th><th>Professor</th><th>1º Bim</th><th>2º Bim</th><th>3º Bim</th><th>4º Bim</th><th>Média</th><th>Situação</th></tr></thead>
            <tbody>
              {notas.map((n) => {
                const m = media(n);
                const variant = m === null ? 'slate' : m >= 7 ? 'green' : m >= 5 ? 'amber' : 'red';
                const sit = m === null ? '—' : m >= 7 ? 'Aprovado' : m >= 5 ? 'Recuperação' : 'Reprovado';
                return (
                  <tr key={n.id}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 3, height: 22, borderRadius: 4, background: discCor(disciplinas, n.disciplina) }} />{n.disciplina}</div></td>
                    <td style={{ color: 'var(--s400)' }}>{n.professor}</td>
                    <td>{fmt(n.b1)}</td><td>{fmt(n.b2)}</td><td>{fmt(n.b3)}</td><td>{fmt(n.b4)}</td>
                    <td style={{ fontSize: 15, fontWeight: 700, color: m && m >= 7 ? 'var(--g600)' : m && m >= 5 ? 'var(--am700)' : 'var(--re700)' }}>{m !== null ? m.toFixed(1) : '—'}</td>
                    <td><Badge variant={variant}>{sit}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function NotasClient({
  modo, turmaAtual, notasPorAluno, disciplinas, turmas,
}: {
  modo: 'aluno' | 'gestao';
  turmaAtual: string;
  notasPorAluno: Record<string, Nota[]>;
  disciplinas: Disciplina[];
  turmas: string[];
}) {
  const [turmaSelecionada, setTurmaSelecionada] = useState(turmas[0] ?? turmaAtual);

  if (modo === 'aluno') {
    return (
      <div>
        <div className="page-header"><div><h1>Notas & Boletim</h1><p>Turma {turmaAtual} · 1º Semestre 2026</p></div></div>
        <BoletimTable turma={turmaAtual} notas={notasPorAluno[turmaAtual] ?? []} disciplinas={disciplinas} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><div><h1>Notas & Boletim</h1><p>Selecione a turma</p></div></div>
      <div className="tabs">
        {turmas.map((t) => (
          <button key={t} className={`tab-btn ${turmaSelecionada === t ? 'active' : ''}`} onClick={() => setTurmaSelecionada(t)}>{t}</button>
        ))}
      </div>
      <BoletimTable turma={turmaSelecionada} notas={notasPorAluno[turmaSelecionada] ?? []} disciplinas={disciplinas} />
    </div>
  );
}
