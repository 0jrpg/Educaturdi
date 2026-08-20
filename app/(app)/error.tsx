'use client';

import { useEffect } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

export default function AppError({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 14, padding: '2rem', textAlign: 'center',
    }}>
      <IconAlertCircle size={36} style={{ color: 'var(--re700)' }} />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--s900)' }}>Não foi possível carregar esta página</h2>
      <p style={{ fontSize: 13.5, color: 'var(--s500)', maxWidth: 400 }}>
        Aconteceu um erro inesperado. Tente novamente — se o problema continuar, saia da conta e entre de novo.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" onClick={() => reset()}>Tentar novamente</button>
        <a className="btn btn-outline" href="/login">Ir para o login</a>
      </div>
    </div>
  );
}
