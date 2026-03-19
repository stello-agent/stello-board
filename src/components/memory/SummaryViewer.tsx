'use client';

import { useMemoryStore } from '@/stores/memory-store';
import Badge from '@/components/shared/Badge';

export default function SummaryViewer() {
  const viewingId = useMemoryStore((s) => s.viewingSessionId);
  const summaries = useMemoryStore((s) => s.summaries);

  const content = viewingId ? summaries[viewingId] : null;
  const wordCount = content ? content.split(/\s+/).length : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-blue">L2 memory.md</h3>
          {content && <Badge variant="blue">{wordCount} words</Badge>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {!content ? (
          <div className="text-xs text-muted text-center py-8">
            {viewingId ? 'no memory summary' : 'select a session'}
          </div>
        ) : (
          <div className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed text-text">
            {content.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line || '\u00A0'}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
