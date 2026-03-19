import { clsx } from 'clsx';

type BadgeVariant = 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'muted';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  green: 'border border-accent/20 bg-accent/12 text-accent',
  blue: 'border border-blue/20 bg-blue/12 text-blue',
  purple: 'border border-purple/20 bg-purple/12 text-purple',
  amber: 'border border-amber/20 bg-amber/12 text-amber',
  red: 'border border-red/20 bg-red/12 text-red',
  muted: 'border border-border/70 bg-white/[0.03] text-muted',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'muted', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
