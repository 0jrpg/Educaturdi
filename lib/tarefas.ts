import type { Grau } from '@/types/database';

/** Dias de tolerância após o prazo, por grau de importância da tarefa/trabalho. */
export const DIAS_TOLERANCIA: Record<Grau, number> = {
  importante: 2,
  normal: 1,
  opcional: 1,
};

export const GRAU_LABEL: Record<Grau, string> = {
  importante: 'Importante',
  normal: 'Normal',
  opcional: 'Opcional',
};

export const GRAU_VARIANT: Record<Grau, 'red' | 'blue' | 'slate'> = {
  importante: 'red',
  normal: 'blue',
  opcional: 'slate',
};

export type SituacaoEntrega = 'no-prazo' | 'tolerancia' | 'expirado';

/**
 * Calcula quanto vale uma entrega, considerando o prazo, o grau de
 * importância (que define os dias de tolerância) e o valor total da
 * tarefa/trabalho.
 *
 * - Dentro do prazo → vale o valor cheio.
 * - Depois do prazo, mas dentro da tolerância → vale metade.
 * - Depois da tolerância → vale 0 (mas a entrega ainda é aceita, pro
 *   professor poder avaliar e decidir).
 */
export function calcularValorEntrega(
  prazo: string, grau: Grau, pontos: number, entregueEm: Date | string
): { valor: number; situacao: SituacaoEntrega } {
  const prazoData = new Date(`${prazo}T23:59:59`);
  const entregue = typeof entregueEm === 'string' ? new Date(entregueEm) : entregueEm;

  if (entregue.getTime() <= prazoData.getTime()) {
    return { valor: pontos, situacao: 'no-prazo' };
  }

  const toleranciaMs = DIAS_TOLERANCIA[grau] * 24 * 60 * 60 * 1000;
  if (entregue.getTime() - prazoData.getTime() <= toleranciaMs) {
    return { valor: Math.round((pontos / 2) * 100) / 100, situacao: 'tolerancia' };
  }

  return { valor: 0, situacao: 'expirado' };
}

export function diasAte(iso: string): number {
  return Math.ceil((new Date(`${iso}T23:59:59`).getTime() - Date.now()) / 86400000);
}

export function prazoFinalComTolerancia(prazo: string, grau: Grau): Date {
  const prazoData = new Date(`${prazo}T23:59:59`);
  return new Date(prazoData.getTime() + DIAS_TOLERANCIA[grau] * 24 * 60 * 60 * 1000);
}
