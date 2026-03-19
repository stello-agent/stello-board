import type { SessionMeta } from '@/types/session';

function pickCanonicalRoot(
  roots: SessionMeta[],
  currentSessionId: string | null,
  byId: Map<string, SessionMeta>,
) {
  if (currentSessionId) {
    let cursor = byId.get(currentSessionId) ?? null;
    while (cursor?.parentId) {
      cursor = byId.get(cursor.parentId) ?? null;
    }
    if (cursor && roots.some((root) => root.id === cursor.id)) {
      return cursor;
    }
  }

  return [...roots].sort((a, b) => {
    if (b.turnCount !== a.turnCount) return b.turnCount - a.turnCount;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  })[0]!;
}

export function normalizeSessionTree(
  sessions: SessionMeta[],
  currentSessionId: string | null,
): {
  sessions: SessionMeta[];
  currentSessionId: string | null;
  droppedRootIds: string[];
} {
  if (sessions.length === 0) {
    return { sessions, currentSessionId, droppedRootIds: [] };
  }

  const byId = new Map(sessions.map((session) => [session.id, session]));
  const roots = sessions.filter((session) => session.parentId === null);

  if (roots.length <= 1) {
    return { sessions, currentSessionId, droppedRootIds: [] };
  }

  const canonicalRoot = pickCanonicalRoot(roots, currentSessionId, byId);
  const keepIds = new Set<string>();
  const stack = [canonicalRoot.id];

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (keepIds.has(id)) continue;
    keepIds.add(id);
    const session = byId.get(id);
    if (!session) continue;
    for (const childId of session.children) {
      stack.push(childId);
    }
  }

  const nextSessions = sessions.filter((session) => keepIds.has(session.id));
  const nextCurrentSessionId =
    currentSessionId && keepIds.has(currentSessionId) ? currentSessionId : canonicalRoot.id;

  return {
    sessions: nextSessions,
    currentSessionId: nextCurrentSessionId,
    droppedRootIds: roots.filter((root) => root.id !== canonicalRoot.id).map((root) => root.id),
  };
}
