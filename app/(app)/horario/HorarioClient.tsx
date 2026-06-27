'use client';

import { useState } from 'react';
import type { Horario, Disciplina } from '@/types/database';

function discCor(disciplinas: Disciplina[], nome: string) {
  return disciplinas.find(d => d.nome === nome)?.cor ?? '#64748b';
}

const DIAS_ORDEM = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const DIAS_NOME = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function GradeSemanal({ horarios, disciplinas }: { horarios: Horario[]; disciplinas: Disciplina[] }) {
  const diaHoje = DIAS_NOME[new Date().getDay()];

  if (!horarios.length) {
    return <p style={{ color: 'var(--s400)', padding: '1rem' }}>Horário não cadastrado para esta turma. Lance pelo Supabase Table Editor.</p>;
  }

  const diasComAula = DIAS_ORDEM.filter(d => horarios.some(h => h.dia === d));
  const maxAulas = Math.max(...diasComAula.map(d => horarios.filter(h => h.dia === d).length));
  const horariosPorDia: Record<string, Horario[]> = {};
  for (const d of diasComAula) horariosPorDia[d] = horarios.filter(h => h.dia === d).sort((a, b) => a.ordem - b.ordem);

  return (
    <>
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 550 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 14px', fontSize: 11, color: 'var(--s400)', textAlign: 'left', borderBottom: '1px solid var(--s200)', width: 100 }}>Horário</th>
                {diasComAula.map((d) => (
                  <th key={d} style={{ padding: '10px 8px', fontSize: 12, fontWeight: 600, color: d === diaHoje ? 'var(--g600)' : 'var(--s600)', textAlign: 'center', borderBottom: '1px solid var(--s200)', background: d === diaHoje ? 'var(--g50)' : '' }}>
                    {d}{d === diaHoje && <><br /><span style={{ fontSize: 9, color: 'var(--g500)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Hoje</span></>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxAulas }, (_, i) => (
                <tr key={i}>
                  <td style={{ padding: '5px 14px', fontSize: 10, color: 'var(--s400)', borderBottom: '1px solid var(--s100)', whiteSpace: 'nowrap' }}>
                    {horariosPorDia[diasComAula[0]]?.[i]?.hora ?? ''}
                  </td>
                  {diasComAula.map((d) => {
                    const a = horariosPorDia[d][i];
                    if (!a) return <td key={d} style={{ borderBottom: '1px solid var(--s100)', background: d === diaHoje ? 'var(--g50)' : '' }} />;
                    const cor = discCor(disciplinas, a.disciplina);
                    return (
                      <td key={d} style={{ padding: '5px 6px', borderBottom: '1px solid var(--s100)', background: d === diaHoje ? 'var(--g50)' : '' }}>
                        <div style={{ borderLeft: `3px solid ${cor}`, background: `${cor}14`, borderRadius: 5, padding: '6px 8px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--s800)' }}>{a.disciplina}</div>
                          <div style={{ fontSize: 10, color: 'var(--s400)' }}>{a.professor}</div>
                          <div style={{ fontSize: 10, color: 'var(--s400)' }}>Sala {a.sala}</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--s400)', marginTop: '.6rem', textAlign: 'center' }}>* Horário sujeito a alterações. Consulte os comunicados.</p>
    </>
  );
}

export default function HorarioClient({
  isAluno, turmaAtual, turmas, horariosPorTurma, disciplinas,
}: {
  isAluno: boolean;
  turmaAtual: string;
  turmas: string[];
  horariosPorTurma: Record<string, Horario[]>;
  disciplinas: Disciplina[];
}) {
  const [turmaSelecionada, setTurmaSelecionada] = useState(isAluno ? turmaAtual : turmas[0]);

  return (
    <div>
      <div className="page-header"><div><h1>Grade Horária</h1><p>{isAluno ? `Turma ${turmaAtual}` : 'Selecione a turma'} · 2026</p></div></div>
      {!isAluno && (
        <div className="tabs">
          {turmas.map((t) => (
            <button key={t} className={`tab-btn ${turmaSelecionada === t ? 'active' : ''}`} onClick={() => setTurmaSelecionada(t)}>{t}</button>
          ))}
        </div>
      )}
      <GradeSemanal horarios={horariosPorTurma[turmaSelecionada] ?? []} disciplinas={disciplinas} />
    </div>
  );
}
