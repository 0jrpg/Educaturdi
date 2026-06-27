'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { IconSchool, IconMail, IconLock, IconEye, IconEyeOff, IconArrowRight, IconLoader2, IconAlertCircle, IconClipboardList, IconReportAnalytics, IconBooks, IconMessages } from '@tabler/icons-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (!email || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }

    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);

    if (error) {
      setErro(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : error.message
      );
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--g900)' }}>
      {/* LEFT — HERO */}
      <div style={heroStyle}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 30%, rgba(61,186,114,.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(39,160,90,.15) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 440 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '3rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--g500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 4px 16px rgba(0,0,0,.25)' }}>
              <IconSchool size={28} color="#fff" />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: '#fff' }}>
              Educa<span style={{ color: 'var(--g400)' }}>Turdi</span>
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, color: '#fff', lineHeight: 1.15, marginBottom: '1.25rem' }}>
            Sua plataforma<br />escolar <em style={{ color: 'var(--g400)', fontStyle: 'italic' }}>completa</em>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Acesse notas, atividades, apostilas e muito mais.<br />
            Tudo em um só lugar, de qualquer dispositivo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: <IconClipboardList size={18} />, label: 'Atividades e entregas com prazo' },
              { icon: <IconReportAnalytics size={18} />, label: 'Boletim e desempenho em tempo real' },
              { icon: <IconBooks size={18} />, label: 'Apostilas e materiais em PDF' },
              { icon: <IconMessages size={18} />, label: 'Comunicados da escola' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--g400)', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,.7)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — FORM */}
      <div style={formPanelStyle}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--s900)', marginBottom: 6 }}>Bem-vindo de volta 👋</h1>
            <p style={{ fontSize: 14, color: 'var(--s500)' }}>Entre com sua conta para continuar</p>
          </div>

          {erro && (
            <div style={{ background: 'var(--re100)', color: 'var(--re700)', borderRadius: 10, padding: '10px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <IconAlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="fg">
              <label className="flabel" htmlFor="email">E-mail</label>
              <div style={{ position: 'relative' }}>
                <IconMail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--s400)' }} />
                <input
                  id="email"
                  type="email"
                  className="finput"
                  style={{ paddingLeft: 42 }}
                  placeholder="seu.email@educaturdi.edu.br"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="fg">
              <label className="flabel" htmlFor="senha">Senha</label>
              <div style={{ position: 'relative' }}>
                <IconLock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--s400)' }} />
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  className="finput"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--s400)', padding: 4 }}
                  tabIndex={-1}
                  aria-label="Mostrar senha"
                >
                  {mostrarSenha ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={carregando}
              style={{ width: '100%', padding: 13, fontSize: 15, fontWeight: 600, marginTop: '0.5rem' }}
            >
              {carregando ? (
                <>
                  <IconLoader2 size={18} className="spin-icon" /> Verificando...
                </>
              ) : (
                <>
                  Entrar na plataforma <IconArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--s100)', textAlign: 'center', fontSize: 12, color: 'var(--s400)' }}>
            EducaTurdi © 2026 · Plataforma Educacional
          </div>
        </div>
      </div>

      <style>{`
        .spin-icon { animation: spin 0.8s linear infinite; }
        @media (max-width: 900px) {
          #__next > div { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

const heroStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem',
  position: 'relative',
  overflow: 'hidden',
};

const formPanelStyle: React.CSSProperties = {
  width: 460,
  minWidth: 460,
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem',
  borderRadius: '24px 0 0 24px',
};
