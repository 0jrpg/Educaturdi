'use client';

import { CDN_BASE_URL } from '@/lib/config';

/**
 * Campo pronto pra colar só o código do arquivo da CDN
 * (ex: 84738567345629.pdf) — o prefixo "cdnjoaoricardo.vercel.app/" já
 * fica fixo na frente, então o usuário só digita a parte que muda.
 */
export default function CdnLinkInput({
  value, onChange, placeholder = '84738567345629.pdf',
}: {
  value: string;
  onChange: (codigo: string) => void;
  placeholder?: string;
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'stretch', borderRadius: 12,
        border: '1.5px solid var(--s200)', overflow: 'hidden', background: '#fff',
      }}
    >
      <span
        style={{
          display: 'flex', alignItems: 'center', padding: '0 10px',
          background: 'var(--s50)', color: 'var(--s500)', fontSize: 12.5,
          fontWeight: 500, borderRight: '1.5px solid var(--s200)', whiteSpace: 'nowrap',
        }}
      >
        {CDN_BASE_URL}/
      </span>
      <input
        className="finput"
        style={{ border: 'none', borderRadius: 0, flex: 1, minWidth: 0 }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
