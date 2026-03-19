'use client';

import { useEffect, useState } from 'react';
import Badge from '@/components/shared/Badge';
import { formatDistanceToNow } from 'date-fns';

export interface ActivityItem {
  id: string;
  type: string;
  label: string;
  timestamp: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

const TYPE_VARIANT: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'muted'> = {
  session: 'amber',
  lifecycle: 'blue',
  memory: 'purple' as 'blue',
  tool: 'green',
  error: 'red',
};

export default function ActivityFeed({ items }: ActivityFeedProps) {
  const [, setTick] = useState(0);

  // Re-render every 10s for relative times
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-1 overflow-y-auto">
      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/70 py-6 text-center text-[10px] text-muted">
          no activity yet
        </div>
      )}
      {items.map((item) => {
        const category = item.type.split(':')[0] ?? 'muted';
        return (
          <div
            key={item.id}
            className="panel-inset flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] transition-colors hover:bg-white/[0.04]"
          >
            <Badge variant={TYPE_VARIANT[category] ?? 'muted'}>
              {item.type.split(':').pop()}
            </Badge>
            <span className="text-text truncate flex-1">{item.label}</span>
            <span className="text-muted shrink-0">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
