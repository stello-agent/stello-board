'use client';

import PageShell from '@/components/layout/PageShell';
import SessionGraph from '@/components/graph/SessionGraph';
import SessionDetailPanel from '@/components/graph/SessionDetailPanel';
import { useSessionStore } from '@/stores/session-store';

export default function GraphPage() {
  const selectedId = useSessionStore((s) => s.selectedSessionId);

  return (
    <PageShell title="session_graph">
      <div className="flex h-full gap-4">
        <div className="panel-surface graph-canvas-bg relative flex-1 overflow-hidden rounded-2xl">
          <SessionGraph />
        </div>
        {selectedId && (
          <div className="panel-surface w-[21rem] shrink-0 overflow-hidden rounded-2xl">
            <SessionDetailPanel />
          </div>
        )}
      </div>
    </PageShell>
  );
}
