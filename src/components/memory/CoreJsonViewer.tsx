'use client';

import { useMemoryStore } from '@/stores/memory-store';
import CodeBlock from '@/components/shared/CodeBlock';
import Badge from '@/components/shared/Badge';

export default function CoreJsonViewer() {
  const core = useMemoryStore((s) => s.core);
  const changedFields = useMemoryStore((s) => s.coreChangedFields);

  const fieldCount = Object.keys(core).length;
  const coreStr = JSON.stringify(core, null, 2);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-accent">L1 core.json</h3>
          <Badge variant="green">{fieldCount} fields</Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {fieldCount === 0 ? (
          <div className="text-xs text-muted text-center py-8">no core data loaded</div>
        ) : (
          <>
            {changedFields.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {changedFields.map((f) => (
                  <Badge key={f} variant="amber">changed: {f}</Badge>
                ))}
              </div>
            )}
            <CodeBlock code={coreStr} language="json" />
          </>
        )}
      </div>
    </div>
  );
}
