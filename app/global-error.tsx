'use client';

import { useEffect } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

export default function GlobalError({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16, padding: '2rem', textAlign: 'center',
          fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#fff',
        }}>
          <IconAlertCircle size={40} color="#ef4444" />
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Algo deu errado</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', maxWidth: 420 }}>
            A plataforma encontrou um erro inesperado. Tente novamente — se persistir, saia e entre de novo na sua conta.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => reset()}
              style={{ background: '#27a05a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Tentar novamente
            </button>
            <a
              href="/login"
              style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.25)', padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              Ir para o login
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
