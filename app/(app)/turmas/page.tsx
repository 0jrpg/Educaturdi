import { createClient } from '@/lib/supabase/server';
import type { Turma, Profile } from '@/types/database';
import Badge from '@/components/Badge';

export default async function TurmasPage() {
  const supabase = createClient();
  const { data: turmas } = await supabase.from('turmas').select('*').order('id');
  const { data: alunos } = await supabase.from('profiles').select('*').eq('tipo', 'aluno');

  const contarAlunos = (turmaId: string) => (alunos as Profile[] | null)?.filter(a => a.turma === turmaId).length ?? 0;

  return (
    <div>
      <div className="page-header">
        <div><h1>Turmas</h1><p>Turmas cadastradas no sistema</p></div>
      </div>
      <div className="grid-3">
        {((turmas as Turma[] | null) ?? []).map((t) => (
          <div key={t.id} className="card" style={{ cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}>
            <div style={{ padding: '1.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ width: 46, height: 46, borderRadius: 11, background: 'var(--g100)', color: 'var(--g700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>{t.id}</div>
                <Badge variant="green">{t.periodo}</Badge>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--s900)', marginBottom: 3 }}>{t.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--s400)', marginBottom: '1rem' }}>{t.nivel} · Sala {t.sala}</div>
              <div style={{ height: 1, background: 'var(--s100)', marginBottom: '1rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--s400)' }}>Alunos</span><span style={{ fontWeight: 600 }}>{contarAlunos(t.id)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--s400)' }}>Responsável</span><span style={{ fontWeight: 600, fontSize: 12 }}>{t.responsavel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
