'use client';

import { clsx } from 'clsx';

interface FilterTabsProps {
  value: 'all' | 'read' | 'write' | 'session' | 'failed';
  onChange: (value: FilterTabsProps['value']) => void;
}

const FILTERS: FilterTabsProps['value'][] = ['all', 'read', 'write', 'session', 'failed'];

export default function FilterTabs({ value, onChange }: FilterTabsProps) {
  return (
    <div className="flex items-center gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={clsx(
            'rounded-md border px-3 py-1.5 text-xs transition-colors',
            value === filter
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-surface text-muted hover:text-text',
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
