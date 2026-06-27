type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'slate';

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  green: 'bg', amber: 'ba', red: 'br', blue: 'bb', slate: 'bs',
};

export default function Badge({
  children, variant = 'slate',
}: { children: React.ReactNode; variant?: BadgeVariant }) {
  return <span className={`badge ${VARIANT_CLASS[variant]}`}>{children}</span>;
}
