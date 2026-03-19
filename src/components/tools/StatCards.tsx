'use client';

import Badge from '@/components/shared/Badge';
import type { ToolCallWithResult } from '@/types/tool';

interface StatCardsProps {
  calls: ToolCallWithResult[];
}

export default function StatCards({ calls }: StatCardsProps) {
  const succeeded = calls.filter((call) => call.result?.success).length;
  const failed = calls.filter((call) => call.result && !call.result.success).length;
  const avgDuration = calls.length > 0
    ? Math.round(
        calls.reduce((sum, call) => sum + (call.result?.duration ?? 0), 0) / calls.length,
      )
    : 0;

  const stats = [
    { label: 'total_calls', value: calls.length, variant: 'blue' as const },
    { label: 'succeeded', value: succeeded, variant: 'green' as const },
    { label: 'failed', value: failed, variant: 'red' as const },
    { label: 'avg_duration', value: `${avgDuration}ms`, variant: 'amber' as const },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="panel-surface rounded-2xl p-4">
          <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted">{stat.label}</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-semibold text-text">{stat.value}</div>
            <Badge variant={stat.variant}>{stat.label}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
