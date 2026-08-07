// Domínio da CDN onde os arquivos (apostilas, resumos, anexos de
// atividades) ficam hospedados. Pra trocar de CDN no futuro, só mudar
// aqui — todo o resto do sistema usa esse valor.
export const CDN_BASE_URL = 'cdnjoaoricardo.vercel.app';

export function montarUrlCdn(codigo: string) {
  const limpo = codigo.trim().replace(/^\/+/, '');
  return `https://${CDN_BASE_URL}/${limpo}`;
}

// Extrai só o código/arquivo de uma URL completa da CDN (pra reexibir no
// campo de edição, por exemplo). Se não for uma URL da CDN, devolve como veio.
export function extrairCodigoCdn(url: string | null | undefined) {
  if (!url) return '';
  const prefixo = `https://${CDN_BASE_URL}/`;
  return url.startsWith(prefixo) ? url.slice(prefixo.length) : url;
}
