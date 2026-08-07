import { createClient } from '@/lib/supabase/server';
import type { Atividade, Comunicado, Disciplina, Horario, Nota } from '@/types/database';
import {
  IconReportAnalytics, IconClipboardList, IconCircleCheck, IconBooks,
  IconSpeakerphone, IconCalendar,
} from '@tabler/icons-react';
import Badge from '@/components/Badge';
import Link from 'next/link';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function diasAte(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const isAluno = profile?.tipo === 'aluno';
  const turma = profile?.turma;

  const { data: disciplinas } = await supabase.from('disciplinas').select('*');
  const discCor = (nome: string) => (disciplinas as Disciplina[] | null)?.find(d => d.nome === nome)?.cor ?? '#64748b';

  // Atividades relevantes (RLS já filtra por turma se for aluno)
  const { data: atividades } = await supabase
    .from('atividades')
    .select('*')
    .order('prazo', { ascending: true });

  const minhasAtivs = (atividades as Atividade[] | null) ?? [];

  // Status de entrega (só relevante para aluno)
  let entregasMap = new Map<string, string>();
  if (isAluno) {
    const { data: entregas } = await supabase.from('entregas').select('*').eq('aluno_id', user!.id);
    entregasMap = new Map((entregas ?? []).map((e: any) => [e.atividade_id, e.status]));
  }

  const ativsComStatus = minhasAtivs.map(a => ({
    ...a,
    status: isAluno ? (entregasMap.get(a.id) ?? (diasAte(a.prazo) < 0 ? 'atrasado' : 'pendente')) : 'pendente',
  }));

  const pendentes = ativsComStatus.filter(a => a.status === 'pendente').length;
  const atrasadas = ativsComStatus.filter(a => a.status === 'atrasado').length;
  const entregues = ativsComStatus.filter(a => a.status === 'entregue').length;

  // Notas (só aluno)
  let mediaGeral = '—';
  if (isAluno) {
    const { data: notas } = await supabase.from('notas').select('*').eq('aluno_id', user!.id);
    const medias = ((notas as Nota[] | null) ?? [])
      .map(n => { const b = [n.b1, n.b2, n.b3, n.b4].filter((v): v is number => v !== null); return b.length ? b.reduce((a, c) => a + c, 0) / b.length : null; })
      .filter((v): v is number => v !== null);
    if (medias.length) mediaGeral = (medias.reduce((a, b) => a + b, 0) / medias.length).toFixed(1);
  }

  // Apostilas disponíveis
  const { data: apostilas } = await supabase.from('apostilas').select('id');
  const apostDisp = apostilas?.length ?? 0;

  // Comunicados recentes
  const { data: comunicadosRaw } = await supabase
    .from('comunicados').select('*').order('created_at', { ascending: false }).limit(3);
  const comunicados = (comunicadosRaw as Comunicado[] | null) ?? [];

  // Aulas de hoje
  const diasNome = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const diaHoje = diasNome[new Date().getDay()];
  let aulasHoje: Horario[] = [];
  if (isAluno && turma) {
    const { data: hor } = await supabase
      .from('horarios').select('*').eq('turma', turma).eq('dia', diaHoje).order('ordem');
    aulasHoje = (hor as Horario[] | null) ?? [];
  }

  const pendentesParaExibir = ativsComStatus.filter(a => a.status !== 'entregue').slice(0, 4);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: 'var(--s900)' }}>
          {greeting()}, {profile?.nome.split(' ')[0]}! 👋
        </h1>
        <p style={{ color: 'var(--s400)', fontSize: 14, marginTop: 3 }}>
          {isAluno ? `Turma ${turma} · ` : ''}
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card fadeUp">
          <div className="stat-icon si-g"><IconReportAnalytics size={19} /></div>
          <div className="stat-lbl">Média Geral</div>
          <div className="stat-val">{mediaGeral}</div>
          <div className="stat-sub">{isAluno ? `${turma} · 1º Semestre` : 'Somente alunos'}</div>
        </div>
        <div className="stat-card fadeUp d1">
          <div className="stat-icon si-a"><IconClipboardList size={19} /></div>
          <div className="stat-lbl">Pendentes</div>
          <div className="stat-val">{pendentes}</div>
          <div className="stat-sub">{atrasadas > 0 ? <span style={{ color: 'var(--re700)' }}>{atrasadas} atrasada(s)</span> : 'Em dia ✓'}</div>
        </div>
        <div className="stat-card fadeUp d2">
          <div className="stat-icon si-g"><IconCircleCheck size={19} /></div>
          <div className="stat-lbl">Entregues</div>
          <div className="stat-val">{entregues}</div>
          <div className="stat-sub">Neste bimestre</div>
        </div>
        <div className="stat-card fadeUp d3">
          <div className="stat-icon si-b"><IconBooks size={19} /></div>
          <div className="stat-lbl">Apostilas</div>
          <div className="stat-val">{apostDisp}</div>
          <div className="stat-sub">Disponíveis</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.4rem' }}>
        <div className="card fadeUp d2">
          <div className="card-hd">
            <h3><IconClipboardList size={16} /> Próximas Atividades</h3>
            <Link href="/atividades" className="btn btn-ghost btn-sm">Ver todas →</Link>
          </div>
          {pendentesParaExibir.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', fontSize: 13, color: 'var(--s400)' }}>
              Nenhuma atividade pendente 🎉
            </div>
          ) : pendentesParaExibir.map((a) => {
            const diff = diasAte(a.prazo);
            const variant = a.status === 'atrasado' ? 'red' : diff <= 2 ? 'amber' : 'blue';
            const txt = a.status === 'atrasado' ? 'Atrasada' : diff === 0 ? 'Hoje!' : diff === 1 ? 'Amanhã' : `${diff} dias`;
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderBottom: '1px solid var(--s100)' }}>
                <div style={{ width: 4, height: 38, borderRadius: 4, background: discCor(a.disciplina), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--s800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titulo}</div>
                  <div style={{ fontSize: 11, color: 'var(--s400)' }}>{a.disciplina}</div>
                </div>
                <Badge variant={variant}>{txt}</Badge>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="card fadeUp d3">
            <div className="card-hd">
              <h3><IconSpeakerphone size={16} /> Comunicados</h3>
              <Link href="/comunicados" className="btn btn-ghost btn-sm">Ver →</Link>
            </div>
            {comunicados.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: 13, color: 'var(--s400)' }}>Nenhum comunicado ainda.</div>
            ) : comunicados.map((c) => {
              const em = ({ Acadêmico: '📚', Evento: '🎉', Saúde: '💉', Sistema: '🔧' } as Record<string, string>)[c.categoria] ?? '📢';
              return (
                <div key={c.id} style={{ display: 'flex', gap: 11, padding: '11px 14px', borderBottom: '1px solid var(--s100)', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 17, marginTop: 1 }}>{em}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--s800)' }}>{c.titulo}</div>
                    <div style={{ fontSize: 11, color: 'var(--s400)' }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {isAluno && aulasHoje.length > 0 && (
            <div className="card fadeUp d4">
              <div className="card-hd">
                <h3><IconCalendar size={16} /> Aulas Hoje</h3>
                <Badge variant="green">{diaHoje}</Badge>
              </div>
              {aulasHoje.map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 14px', borderBottom: '1px solid var(--s100)' }}>
                  <div style={{ fontSize: 11, color: 'var(--s400)', minWidth: 88, fontVariantNumeric: 'tabular-nums' }}>{a.hora}</div>
                  <div style={{ width: 3, height: 30, borderRadius: 4, background: discCor(a.disciplina), flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--s800)' }}>{a.disciplina}</div>
                    <div style={{ fontSize: 11, color: 'var(--s400)' }}>{a.professor} · Sala {a.sala}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
