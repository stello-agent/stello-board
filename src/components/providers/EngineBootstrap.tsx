'use client';

import { useEffect } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { useToolStore } from '@/stores/tool-store';
import { useMemoryStore } from '@/stores/memory-store';
import { useChatStore } from '@/stores/chat-store';
import { fetchSyncedSessions, fetchToolCalls } from '@/lib/client-engine-sync';

export default function EngineBootstrap() {
  const setSessions = useSessionStore((s) => s.setSessions);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);
  const selectSession = useSessionStore((s) => s.selectSession);
  const setCalls = useToolStore((s) => s.setCalls);
  const setViewingSession = useMemoryStore((s) => s.setViewingSession);
  const addSystemEvent = useChatStore((s) => s.addSystemEvent);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [normalized, toolCalls] = await Promise.all([
        fetchSyncedSessions(),
        fetchToolCalls(),
      ]);

      if (cancelled) return;

      setSessions(normalized.sessions);
      setCalls(toolCalls);

      if (normalized.droppedRootIds.length > 0) {
        addSystemEvent({
          id: crypto.randomUUID(),
          type: 'session:normalized',
          label: `graph normalized: hidden ${normalized.droppedRootIds.length} duplicate root session(s)`,
          timestamp: new Date().toISOString(),
        });
      }

      const activeId = normalized.currentSessionId ?? normalized.sessions[0]?.id ?? null;
      if (activeId) {
        setCurrentSession(activeId);
        setViewingSession(activeId);
        selectSession(activeId);
      }
    }

    load().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [addSystemEvent, selectSession, setCalls, setCurrentSession, setSessions, setViewingSession]);

  return null;
}
