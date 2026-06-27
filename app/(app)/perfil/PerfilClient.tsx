'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import Badge from '@/components/Badge';
import { IconLock, IconLogout } from '@tabler/icons-react';
import type { Profile } from '@/types/database';

function initials(nome: string) {
  return nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}
function avatarColor(name: string) {
  const colors = ['#136337', '#1a82b4', '#7c3aed', '#c2410c', '#b91c7c', '#0d7377', '#b45309'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export default function PerfilClient({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter();
  const supabase = createClient();
  const showToast = useToast();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [salvando, setSalvando] = useState(false);

  const color = avatarColor(profile.nome);
  const roleLabel = { aluno: `Aluno · Turma ${profile.turma}`, professor: 'Professor', admin: 'Administrador' }[profile.tipo];

  async function salvarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha.length < 6) {
      showToast('A senha precisa ter ao menos 6 caracteres.', 'error');
      return;
    }
    if (novaSenha !== confirmar) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSalvando(false);
    if (error) {
      showToast('Erro ao trocar senha: ' + error.message, 'error');
      return;
    }
    showToast('Senha alterada com sucesso!', 'success');
    setNovaSenha('');
    setConfirmar('');
  }

  async function sair() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div>
      <div className="page-header"><div><h1>Meu Perfil</h1><p>Informações da sua conta</p></div></div>
      <div className="grid-2" style={{ gap: '1.4rem', alignItems: 'start' }}>
        <div className="card">
          <div style={{ padding: '1.8rem', textAlign: 'center', borderBottom: '1px solid var(--s100)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${color}22`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, margin: '0 auto 1rem' }}>
              {initials(profile.nome)}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--s900)' }}>{profile.nome}</div>
            <div style={{ fontSize: 13, color: 'var(--s400)', marginTop: 3 }}>{roleLabel}</div>
            <div style={{ marginTop: 11 }}><Badge variant="green">● Conta ativa</Badge></div>
          </div>
          <div style={{ padding: '1.2rem 1.4rem' }}>
            {[
              ['E-mail', email, 'monospace'],
              ['Tipo de conta', profile.tipo, ''],
              ...(profile.tipo === 'aluno' ? [['Turma', profile.turma ?? '', '']] : []),
              ['Escola', 'C.E. EducaTurdi', ''],
            ].map(([k, v, f]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--s100)', fontSize: 13 }}>
                <span style={{ color: 'var(--s400)' }}>{k}</span>
                <span style={{ fontWeight: 500, fontFamily: f || 'inherit', textTransform: 'capitalize' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <form className="card" style={{ padding: '1.3rem' }} onSubmit={salvarSenha}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: '1rem' }}>Alterar Senha</h3>
            <div className="fg">
              <label className="flabel">Nova senha</label>
              <input type="password" className="finput" placeholder="••••••••" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            </div>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label className="flabel">Confirmar nova senha</label>
              <input type="password" className="finput" placeholder="••••••••" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--s100)' }}>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                <IconLock size={16} /> {salvando ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </div>
          </form>

          <div className="card" style={{ padding: '1.3rem', borderColor: 'var(--re100)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--re700)', marginBottom: '.4rem' }}>Zona de perigo</h3>
            <p style={{ fontSize: 12, color: 'var(--s400)', marginBottom: '1rem' }}>Ao sair, sua sessão será encerrada neste dispositivo.</p>
            <button className="btn btn-danger" onClick={sair}><IconLogout size={16} /> Sair da conta</button>
          </div>
        </div>
      </div>
    </div>
  );
}
