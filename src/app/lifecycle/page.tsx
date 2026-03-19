'use client';

import { useEffect, useState } from 'react';
import PageShell from '@/components/layout/PageShell';
import Timeline from '@/components/lifecycle/Timeline';
import StepDetail from '@/components/lifecycle/StepDetail';
import { useLifecycleStore } from '@/stores/lifecycle-store';
import { useSessionStore } from '@/stores/session-store';

export default function LifecyclePage() {
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const currentTurn = useLifecycleStore((s) => s.currentTurn);
  const history = useLifecycleStore((s) => s.history);
  const setHistory = useLifecycleStore((s) => s.setHistory);
  const setCurrentTurn = useLifecycleStore((s) => s.setCurrentTurn);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const activeTurn = currentTurn ?? history[history.length - 1];
  const steps = activeTurn?.steps ?? [];

  useEffect(() => {
    if (!currentSessionId) return;

    let cancelled = false;

    async function loadHistory() {
      const res = await fetch(`/api/engine/lifecycle/${currentSessionId}`);
      const data = (await res.json()) as { history: typeof history };
      if (cancelled) return;
      setHistory(data.history);
      setCurrentTurn(data.history[data.history.length - 1] ?? null);
    }

    loadHistory().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [currentSessionId, setCurrentTurn, setHistory]);

  return (
    <PageShell title="lifecycle_timeline">
      <div className="panel-surface flex h-full flex-col overflow-hidden rounded-2xl">
        {/* Timeline bar */}
        <div className="border-b border-border/70 bg-black/10">
          <Timeline
            steps={steps}
            selectedStep={selectedStep}
            onSelectStep={setSelectedStep}
          />
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-hidden">
          {selectedStep ? (
            <StepDetail hook={selectedStep} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted text-xs">
              {steps.length > 0
                ? 'select a lifecycle step to inspect'
                : 'waiting for lifecycle events...'}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
