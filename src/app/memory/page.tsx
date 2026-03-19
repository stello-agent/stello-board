'use client';

import { useEffect } from 'react';
import PageShell from '@/components/layout/PageShell';
import SessionSelector from '@/components/memory/SessionSelector';
import CoreJsonViewer from '@/components/memory/CoreJsonViewer';
import SummaryViewer from '@/components/memory/SummaryViewer';
import RecordsViewer from '@/components/memory/RecordsViewer';
import { useMemoryStore } from '@/stores/memory-store';

export default function MemoryPage() {
  const viewingSessionId = useMemoryStore((s) => s.viewingSessionId);
  const setCore = useMemoryStore((s) => s.setCore);
  const setSummary = useMemoryStore((s) => s.setSummary);
  const setRecords = useMemoryStore((s) => s.setRecords);

  useEffect(() => {
    if (!viewingSessionId) return;
    const sessionId = viewingSessionId;

    let cancelled = false;

    async function loadMemory() {
      const res = await fetch(`/api/engine/memory/${sessionId}`);
      const data = (await res.json()) as {
        core: Record<string, unknown>;
        summary: string | null;
        records: [];
      };

      if (cancelled) return;

      setCore(data.core);
      setSummary(sessionId, data.summary ?? '');
      setRecords(sessionId, data.records);
    }

    loadMemory().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [setCore, setRecords, setSummary, viewingSessionId]);

  return (
    <PageShell
      title="memory_inspector"
      actions={<SessionSelector />}
    >
      <div className="flex h-full gap-4">
        <div className="panel-surface flex-1 min-w-0 overflow-hidden rounded-2xl">
          <CoreJsonViewer />
        </div>
        <div className="panel-surface flex-1 min-w-0 overflow-hidden rounded-2xl">
          <SummaryViewer />
        </div>
        <div className="panel-surface flex-1 min-w-0 overflow-hidden rounded-2xl">
          <RecordsViewer />
        </div>
      </div>
    </PageShell>
  );
}
