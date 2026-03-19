'use client';

import { useState } from 'react';
import type { ToolCallWithResult } from '@/types/tool';
import Badge from '@/components/shared/Badge';
import CodeBlock from '@/components/shared/CodeBlock';

interface ToolTableProps {
  calls: ToolCallWithResult[];
}

export default function ToolTable({ calls }: ToolTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden">
      <div className="grid grid-cols-[160px_1.5fr_140px_1fr_110px_90px] gap-3 border-b border-border/70 px-4 py-4 text-[10px] uppercase tracking-[0.2em] text-muted">
        <span>timestamp</span>
        <span>tool_name</span>
        <span>session</span>
        <span>args</span>
        <span>duration</span>
        <span>status</span>
      </div>

      <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
        {calls.map((call) => {
          const expanded = expandedId === call.id;

          return (
            <div key={call.id} className="border-b border-border/60 last:border-b-0">
              <button
                onClick={() => setExpandedId(expanded ? null : call.id)}
                className="grid w-full grid-cols-[160px_1.5fr_140px_1fr_110px_90px] gap-3 px-4 py-3.5 text-left text-xs transition-colors hover:bg-white/[0.03]"
              >
                <span className="text-muted">{new Date(call.timestamp).toLocaleTimeString()}</span>
                <span className="text-text">{call.name}</span>
                <span className="text-muted">{call.sessionId.slice(0, 8)}</span>
                <span className="truncate text-muted">{JSON.stringify(call.args)}</span>
                <span className="text-muted">{call.result?.duration ?? 0}ms</span>
                <span>
                  <Badge variant={call.result?.success ? 'green' : 'red'}>
                    {call.result?.success ? 'success' : 'error'}
                  </Badge>
                </span>
              </button>

              {expanded && (
                <div className="grid gap-3 border-t border-border/60 bg-black/10 px-4 py-4 md:grid-cols-2">
                  <CodeBlock code={JSON.stringify(call.args, null, 2)} language="json" />
                  <CodeBlock
                    code={JSON.stringify(call.result?.data ?? { error: call.result?.error }, null, 2)}
                    language="json"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
