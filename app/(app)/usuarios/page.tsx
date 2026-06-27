import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';
import Badge from '@/components/Badge';

function initials(nome: string) {
  return nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}
function avatarColor(name: string) {
  const colors = ['#136337', '#1a82b4', '#7c3aed', '#c2410c', '#b91c7c', '#0d7377', '#b45309'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export default async function UsuariosPage() {
  const supabase = createClient();
  const { data: usuarios } = await supabase.from('profiles').select('*').order('tipo').order('nome');

  return (
    <div>
      <div className="page-header">
        <div><h1>Usuários</h1><p>Gerenciados via Supabase Authentication</p></div>
      </div>

      <div className="card" style={{ marginBottom: '1.3rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 26, flexShrink: 0 }}>🔐</div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--s800)', marginBottom: 5 }}>Como adicionar usuários</div>
              <p style={{ fontSize: 13, color: 'var(--s500)', lineHeight: 1.75, marginBottom: 6 }}>
                Vá até <strong>Supabase Dashboard → Authentication → Users → Add user</strong>.
                Ao criar, defina e-mail/senha e adicione em &quot;User Metadata&quot; um JSON assim:
              </p>
              <code style={{ display: 'block', background: 'var(--s900)', color: 'var(--g400)', padding: '11px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.8 }}>
                {'{ "nome": "Ana Turdi", "tipo": "aluno", "turma": "3B" }'}
              </code>
              <p style={{ fontSize: 12, color: 'var(--s400)', marginTop: 8 }}>
                Um gatilho (trigger) no banco cria o perfil automaticamente a partir desses metadados.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><h3>Usuários cadastrados ({usuarios?.length ?? 0})</h3></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Nome</th><th>Tipo</th><th>Turma</th><th>Cadastrado em</th></tr></thead>
            <tbody>
              {((usuarios as Profile[] | null) ?? []).map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${avatarColor(u.nome)}22`, color: avatarColor(u.nome), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                        {initials(u.nome)}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{u.nome}</span>
                    </div>
                  </td>
                  <td><Badge variant={u.tipo === 'admin' ? 'red' : u.tipo === 'professor' ? 'blue' : 'green'}>{u.tipo}</Badge></td>
                  <td>{u.turma ? u.turma : <span style={{ color: 'var(--s300)' }}>—</span>}</td>
                  <td style={{ fontSize: 12, color: 'var(--s400)' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
