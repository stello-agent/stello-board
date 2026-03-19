'use client';

import { useSessionStore } from '@/stores/session-store';
import { useMemoryStore } from '@/stores/memory-store';
import { ChevronDown } from 'lucide-react';

export default function SessionSelector() {
  const sessions = useSessionStore((s) => s.sessions);
  const viewingId = useMemoryStore((s) => s.viewingSessionId);
  const setViewingSession = useMemoryStore((s) => s.setViewingSession);

  return (
    <div className="relative">
      <select
        value={viewingId ?? ''}
        onChange={(e) => setViewingSession(e.target.value || null)}
        className="appearance-none bg-surface border border-border rounded px-3 py-1.5 pr-8 text-xs text-text outline-none focus:border-accent transition-colors cursor-pointer w-full"
      >
        <option value="">select session...</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {'  '.repeat(s.depth)}{s.label} ({s.id.slice(0, 8)})
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
    </div>
  );
}
