'use client';

import { useState } from 'react';
import { signInAction } from './actions';
import { IconSchool, IconMail, IconLock, IconEye, IconEyeOff, IconArrowRight, IconLoader2, IconAlertCircle, IconClipboardList, IconReportAnalytics, IconBooks, IconMessages } from '@tabler/icons-react';

export default function LoginPage() {
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
    // O login roda no servidor (Server Action) — ele mesmo redireciona
    // pro /dashboard já com o cookie de sessão certinho. Se der erro de
    // credenciais, ele volta aqui com a mensagem em vez de redirecionar.
    //
    // Também colocamos um limite de tempo: se o servidor não responder
    // em 15s (projeto Supabase fora do ar, RLS travada, rede etc.), a
    // gente avisa em vez de deixar girando pra sempre sem explicação.
    try {
      const resultado = await Promise.race([
        signInAction(email, senha),
        new Promise<{ error: string }>((resolve) =>
          setTimeout(() => resolve({ error: 'O servidor demorou demais pra responder. Tente novamente em instantes.' }), 15000)
        ),
      ]);
      if (resultado?.error) {
        setErro(resultado.error);
      }
    } catch (err: any) {
      // O redirect() da Server Action lança um sinal interno do Next.js
      // que não é um erro de verdade — deixa ele passar direto.
      if (err?.digest?.startsWith?.('NEXT_REDIRECT')) throw err;
      setErro('Não foi possível conectar. Verifique sua internet e tente de novo.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-shell" style={{ minHeight: '100vh', display: 'flex', background: 'var(--g900)' }}>
      {/* LEFT — HERO */}
      <div className="login-hero" style={heroStyle}>
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 30%, rgba(61,186,114,.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(39,160,90,.15) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 440, animation: 'login-hero-in .6s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '3rem' }}>
            <div className="login-logo-icon" style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--g500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 4px 16px rgba(0,0,0,.25)' }}>
              <IconSchool size={28} color="#fff" />
            </div>
            <div style={{ fontFamily: 'var(--font-logo)', fontWeight: 700, fontSize: 28, color: '#fff', letterSpacing: '-.3px' }}>
              Educa<span style={{ color: 'var(--g400)' }}>Turdi</span>
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, color: '#fff', lineHeight: 1.15, marginBottom: '1.25rem' }}>
            Sua plataforma<br />escolar <em style={{ color: 'var(--g400)', fontStyle: 'italic' }}>completa</em>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Acesse notas, tarefas, provas, apostilas e muito mais.<br />
            Tudo em um só lugar, de qualquer dispositivo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: <IconClipboardList size={18} />, label: 'Atividades e entregas com prazo' },
              { icon: <IconReportAnalytics size={18} />, label: 'Boletim e desempenho em tempo real' },
              { icon: <IconBooks size={18} />, label: 'Apostilas e materiais em PDF' },
              { icon: <IconMessages size={18} />, label: 'Comunicados da escola' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, animation: `login-hero-in .5s ease both`, animationDelay: `${0.15 + i * 0.08}s` }}>
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
      <div className="login-form-panel" style={formPanelStyle}>
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
        @keyframes login-hero-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-logo-icon { animation: login-logo-pulse 3.5s ease-in-out infinite; }
        @keyframes login-logo-pulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,.25), 0 0 0 0 rgba(39,160,90,.4); }
          50% { box-shadow: 0 4px 16px rgba(0,0,0,.25), 0 0 0 8px rgba(39,160,90,0); }
        }
        .login-blob {
          position: absolute; border-radius: 50%; filter: blur(60px); opacity: .5; pointer-events: none;
          animation: login-blob-float 12s ease-in-out infinite;
        }
        .login-blob-1 { width: 320px; height: 320px; background: #27a05a; top: -80px; left: -60px; }
        .login-blob-2 { width: 260px; height: 260px; background: #3dba72; bottom: -60px; right: -40px; animation-delay: -6s; animation-duration: 14s; }
        @keyframes login-blob-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.08); }
        }
        @media (max-width: 900px) {
          .login-shell { flex-direction: column; }
          .login-hero { display: none; }
          .login-form-panel { width: 100% !important; min-width: 0 !important; border-radius: 0 !important; padding: 2rem 1.4rem !important; }
        }
        @media (max-width: 420px) {
          .login-form-panel { padding: 1.6rem 1.1rem !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-logo-icon, .login-blob, [style*="login-hero-in"] { animation: none !important; }
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
  maxWidth: '100%',
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem',
  borderRadius: '24px 0 0 24px',
};
