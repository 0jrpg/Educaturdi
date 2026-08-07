'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconX, IconDownload, IconLoader2, IconFileText, IconAlertCircle,
} from '@tabler/icons-react';

export type TipoArquivo = 'pdf' | 'docx' | 'doc' | 'pptx' | 'ppt' | 'xlsx' | 'xls' | 'outro';

export function detectarTipoArquivo(nomeOuUrl: string | null | undefined): TipoArquivo {
  if (!nomeOuUrl) return 'outro';
  const limpo = nomeOuUrl.split('?')[0].toLowerCase();
  const ext = limpo.split('.').pop() ?? '';
  if (['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'].includes(ext)) return ext as TipoArquivo;
  return 'outro';
}

/**
 * Visualizador de documentos próprio do EducaTurdi — usado por Apostilas e
 * Resumos. Renderiza o PDF diretamente (sem sair do site) e, para arquivos
 * do Office (Word/PowerPoint/Excel), usa o visualizador do Office embutido
 * dentro do nosso próprio "chrome" com a marca da escola, título, disciplina
 * e ações de baixar/imprimir/abrir em nova aba.
 */
export default function DocumentViewer({
  open, onClose, titulo, subtitulo, disciplinaCor, arquivoUrl, corBadge,
}: {
  open: boolean;
  onClose: () => void;
  titulo: string;
  subtitulo?: string;
  disciplinaCor?: string;
  corBadge?: string;
  arquivoUrl: string | null;
}) {
  const [zoom, setZoom] = useState(100);
  const [carregado, setCarregado] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const tipo = useMemo(() => detectarTipoArquivo(arquivoUrl), [arquivoUrl]);
  const isPdf = tipo === 'pdf';
  const isOffice = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'].includes(tipo);

  const srcVisualizacao = useMemo(() => {
    if (!arquivoUrl) return '';
    if (isPdf) return `${arquivoUrl}#toolbar=0&navpanes=0&view=FitH`;
    if (isOffice) return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(arquivoUrl)}`;
    return arquivoUrl;
  }, [arquivoUrl, isPdf, isOffice]);

  useEffect(() => { setCarregado(false); }, [srcVisualizacao]);

  if (!open) return null;

  function imprimir() {
    try {
      iframeRef.current?.contentWindow?.print();
    } catch {
      window.open(arquivoUrl ?? '', '_blank');
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(10,14,25,.82)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Cabeçalho com a marca do sistema */}
      <div
        className="dv-header"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.3rem', background: '#111827', color: '#fff',
          borderBottom: `3px solid ${disciplinaCor ?? corBadge ?? '#136337'}`,
          flexShrink: 0, gap: 12, flexWrap: 'wrap',
        }}
      >
        <div className="dv-title" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: disciplinaCor ?? '#136337', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconFileText size={19} color="#fff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {titulo}
            </div>
            {subtitulo && (
              <div className="dv-subtitulo" style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitulo}</div>
            )}
          </div>
        </div>

        <div className="dv-controls" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {isPdf && (
            <>
              <button title="Diminuir zoom" className="dv-btn" style={{ fontSize: 16, fontWeight: 700 }} onClick={() => setZoom(z => Math.max(50, z - 10))}>
                −
              </button>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', minWidth: 34, textAlign: 'center' }}>{zoom}%</span>
              <button title="Aumentar zoom" className="dv-btn" style={{ fontSize: 16, fontWeight: 700 }} onClick={() => setZoom(z => Math.min(200, z + 10))}>
                +
              </button>
              <div className="dv-sep" style={{ width: 1, height: 20, background: 'rgba(255,255,255,.15)', margin: '0 4px' }} />
              <button title="Imprimir" className="dv-btn" style={{ width: 'auto', padding: '0 10px', fontSize: 12 }} onClick={imprimir}>
                <span className="dv-label">Imprimir</span>
              </button>
            </>
          )}
          {arquivoUrl && (
            <>
              <a title="Abrir em nova aba" className="dv-btn" style={{ width: 'auto', padding: '0 10px', fontSize: 12 }} href={arquivoUrl} target="_blank" rel="noreferrer">
                <span className="dv-label">Abrir em nova aba</span>
              </a>
              <a title="Baixar" className="dv-btn" href={arquivoUrl} download>
                <IconDownload size={17} />
              </a>
            </>
          )}
          <div className="dv-sep" style={{ width: 1, height: 20, background: 'rgba(255,255,255,.15)', margin: '0 4px' }} />
          <button title="Fechar" className="dv-btn" onClick={onClose}>
            <IconX size={19} />
          </button>
        </div>
      </div>

      {/* Área do documento */}
      <div style={{ flex: 1, overflow: 'auto', background: '#525659', display: 'flex', justifyContent: 'center' }}>
        {!arquivoUrl ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: '#fff', padding: '2rem' }}>
            <IconAlertCircle size={34} style={{ marginBottom: 10, opacity: 0.7 }} />
            <p style={{ fontSize: 14 }}>Nenhum arquivo foi enviado ainda para este material.</p>
          </div>
        ) : (
          <div
            style={{
              width: isPdf ? `${zoom}%` : '100%', maxWidth: isPdf ? 'none' : 960,
              height: '100%', transition: 'width .15s', margin: isPdf ? undefined : '0 auto',
              position: 'relative',
            }}
          >
            {!carregado && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#525659' }}>
                <IconLoader2 size={26} className="dv-spin" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              key={srcVisualizacao}
              src={srcVisualizacao}
              title={titulo}
              onLoad={() => setCarregado(true)}
              style={{ width: '100%', height: '100%', border: 0, background: '#fff', boxShadow: '0 0 24px rgba(0,0,0,.35)' }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .dv-btn {
          width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center;
          justify-content: center; color: #fff; background: rgba(255,255,255,.06);
          border: none; cursor: pointer; text-decoration: none;
        }
        .dv-btn:hover { background: rgba(255,255,255,.16); }
        .dv-spin { animation: dv-spin 0.9s linear infinite; }
        @keyframes dv-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .dv-header { padding: 0.6rem 0.8rem !important; gap: 8px !important; }
          .dv-label { display: none; }
          .dv-sep { display: none; }
          .dv-subtitulo { max-width: 46vw; }
        }
        @media (max-width: 420px) {
          .dv-title > div:last-child { max-width: 42vw; }
        }
      `}</style>
    </div>
  );
}
