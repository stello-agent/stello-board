'use client';

import { useCallback, useEffect, useMemo } from 'react';
import PageShell from '@/components/layout/PageShell';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import MiniGraph from '@/components/graph/MiniGraph';
import ActivityFeed, { type ActivityItem } from '@/components/chat/ActivityFeed';
import { useChatStore } from '@/stores/chat-store';
import { useSessionStore } from '@/stores/session-store';
import { useToolStore } from '@/stores/tool-store';
import { fetchSyncedSessions, fetchToolCalls } from '@/lib/client-engine-sync';

function resolveSessionId(
  sessions: Array<{ id: string; label: string }>,
  rawQuery: string,
) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return null;

  return (
    sessions.find((session) => session.id.toLowerCase() === query)?.id ??
    sessions.find((session) => session.id.toLowerCase().startsWith(query))?.id ??
    sessions.find((session) => session.label.toLowerCase() === query)?.id ??
    sessions.find((session) => session.label.toLowerCase().includes(query))?.id ??
    null
  );
}

export default function ChatPage() {
  const sessions = useSessionStore((s) => s.sessions);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);
  const setSessions = useSessionStore((s) => s.setSessions);
  const selectSession = useSessionStore((s) => s.selectSession);
  const setItems = useChatStore((s) => s.setItems);
  const addMessage = useChatStore((s) => s.addMessage);
  const addSystemEvent = useChatStore((s) => s.addSystemEvent);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const setCalls = useToolStore((s) => s.setCalls);
  const calls = useToolStore((s) => s.calls);

  useEffect(() => {
    if (!currentSessionId) return;
    const sessionId = currentSessionId;

    let cancelled = false;

    async function loadTranscript() {
      const res = await fetch(`/api/engine/memory/${sessionId}`);
      const data = (await res.json()) as {
        records: Array<{
          role: 'user' | 'assistant' | 'system';
          content: string;
          timestamp: string;
          metadata?: Record<string, unknown>;
        }>;
      };

      if (cancelled) return;

      setItems(
        data.records.map((record, index) => ({
          kind: 'message' as const,
          data: {
            id: `${sessionId}-${index}-${record.timestamp}`,
            sessionId: sessionId,
            role: record.role,
            content: record.content,
            timestamp: record.timestamp,
            toolCalls: Array.isArray(record.metadata?.toolCalls)
              ? (record.metadata.toolCalls as Array<{
                  id: string;
                  name: string;
                  args: Record<string, unknown>;
                  result?: unknown;
                  error?: string;
                  duration?: number;
                  status: 'pending' | 'success' | 'error';
                }>)
              : undefined,
          },
        })),
      );
    }

    loadTranscript().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [currentSessionId, setItems]);

  const activities = useMemo<ActivityItem[]>(
    () =>
      calls.slice(0, 12).map((call) => ({
        id: call.id,
        type: `tool:${call.name}`,
        label: `${call.name} · ${call.sessionId.slice(0, 8)}`,
        timestamp: call.result?.timestamp ?? call.timestamp,
      })),
    [calls],
  );

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();

      if (trimmed.startsWith('/')) {
        const [command, ...rest] = trimmed.split(/\s+/);
        const arg = rest.join(' ');

        if (command === '/help') {
          addSystemEvent({
            id: crypto.randomUUID(),
            type: 'command:help',
            label: 'commands: /switch <label|id>, /sessions, /where, /clear, /help',
            timestamp: new Date().toISOString(),
          });
          return;
        }

        if (command === '/sessions') {
          addSystemEvent({
            id: crypto.randomUUID(),
            type: 'command:sessions',
            label: sessions.length > 0
              ? sessions.map((session) => session.label).join(' · ')
              : 'no sessions available',
            timestamp: new Date().toISOString(),
          });
          return;
        }

        if (command === '/switch') {
          const nextId = resolveSessionId(sessions, arg);

          if (!nextId) {
            addSystemEvent({
              id: crypto.randomUUID(),
              type: 'command:error',
              label: `switch failed: session not found for "${arg}"`,
              timestamp: new Date().toISOString(),
            });
            return;
          }

          const target = sessions.find((session) => session.id === nextId);
          setCurrentSession(nextId);
          selectSession(nextId);
          addSystemEvent({
            id: crypto.randomUUID(),
            type: 'session:switched',
            label: `session_switched: ${target?.label ?? nextId}`,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        if (command === '/where') {
          const current = sessions.find((session) => session.id === currentSessionId);
          addSystemEvent({
            id: crypto.randomUUID(),
            type: 'command:where',
            label: current
              ? `current_session: ${current.label} (${current.id.slice(0, 8)})`
              : 'current_session: none',
            timestamp: new Date().toISOString(),
          });
          return;
        }

        if (command === '/clear') {
          clearMessages();
          return;
        }

        addSystemEvent({
          id: crypto.randomUUID(),
          type: 'command:error',
          label: `unknown command: ${command}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!currentSessionId) return;

      addMessage({
        id: crypto.randomUUID(),
        sessionId: currentSessionId,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      });

      setStreaming(true);

      try {
        const res = await fetch('/api/engine/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentSessionId, message: text }),
        });
        const data = (await res.json()) as {
          assistantMessage: {
            id: string;
            sessionId: string;
            role: 'assistant';
            content: string;
            timestamp: string;
            toolCalls?: Array<{
              id: string;
              name: string;
              args: Record<string, unknown>;
              result?: unknown;
              error?: string;
              duration?: number;
              status: 'success' | 'error';
            }>;
          };
          currentSessionId: string;
        };
        const [normalized, toolCalls] = await Promise.all([
          fetchSyncedSessions(),
          fetchToolCalls(),
        ]);

        addMessage(data.assistantMessage);
        setSessions(normalized.sessions);
        setCalls(toolCalls);
        setCurrentSession(normalized.currentSessionId ?? data.currentSessionId);
        selectSession(normalized.currentSessionId ?? data.currentSessionId);
      } finally {
        setStreaming(false);
      }
    },
    [
      addMessage,
      addSystemEvent,
      clearMessages,
      setSessions,
      currentSessionId,
      selectSession,
      sessions,
      setCalls,
      setCurrentSession,
      setStreaming,
    ],
  );

  return (
    <PageShell title="agent_chat">
      <div className="flex h-full gap-4">
        {/* Chat area */}
        <div className="panel-surface flex flex-1 flex-col overflow-hidden rounded-2xl">
          <div className="border-b border-border/70 px-5 py-3">
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted">
              slash command console
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatMessages />
          </div>
          <ChatInput onSend={handleSend} />
        </div>

        {/* Right panel */}
        <div className="panel-surface flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl">
          <div className="border-b border-border/70 p-4">
            <h3 className="text-[10px] text-muted uppercase tracking-wider mb-2">topology</h3>
            <MiniGraph />
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <h3 className="text-[10px] text-muted uppercase tracking-wider mb-2">activity_feed</h3>
            <ActivityFeed items={activities} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
