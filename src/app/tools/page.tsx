'use client';

import { useEffect, useMemo } from 'react';
import PageShell from '@/components/layout/PageShell';
import FilterTabs from '@/components/tools/FilterTabs';
import StatCards from '@/components/tools/StatCards';
import ToolTable from '@/components/tools/ToolTable';
import { useToolStore } from '@/stores/tool-store';
import { TOOL_CATEGORIES } from '@/lib/constants';

export default function ToolsPage() {
  const calls = useToolStore((s) => s.calls);
  const filter = useToolStore((s) => s.filter);
  const setCalls = useToolStore((s) => s.setCalls);
  const setFilter = useToolStore((s) => s.setFilter);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch('/api/engine/tools');
      const data = (await res.json()) as { calls: typeof calls };
      if (!cancelled) {
        setCalls(data.calls);
      }
    }

    load().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [setCalls]);

  const filteredCalls = useMemo(() => {
    switch (filter) {
      case 'read':
        return calls.filter((call) => (TOOL_CATEGORIES.read as readonly string[]).includes(call.name));
      case 'write':
        return calls.filter((call) => (TOOL_CATEGORIES.write as readonly string[]).includes(call.name));
      case 'session':
        return calls.filter((call) => (TOOL_CATEGORIES.session as readonly string[]).includes(call.name));
      case 'failed':
        return calls.filter((call) => call.result && !call.result.success);
      default:
        return calls;
    }
  }, [calls, filter]);

  return (
    <PageShell
      title="tool_calls_log"
      actions={<FilterTabs value={filter} onChange={setFilter} />}
    >
      <div className="flex h-full flex-col gap-4 p-4">
        <StatCards calls={calls} />
        <div className="panel-surface overflow-hidden rounded-2xl">
          <ToolTable calls={filteredCalls} />
        </div>
      </div>
    </PageShell>
  );
}
