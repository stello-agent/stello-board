import { normalizeSessionTree } from '@/lib/session-tree';
import type { ToolCallWithResult } from '@/types/tool';
import type { SessionMeta } from '@/types/session';

interface SessionsResponse {
  sessions: SessionMeta[];
  currentSessionId: string | null;
}

export async function fetchSyncedSessions() {
  const response = await fetch('/api/engine/sessions');
  const data = (await response.json()) as SessionsResponse;
  return normalizeSessionTree(data.sessions, data.currentSessionId);
}

export async function fetchToolCalls() {
  const response = await fetch('/api/engine/tools');
  const data = (await response.json()) as { calls: ToolCallWithResult[] };
  return data.calls;
}
