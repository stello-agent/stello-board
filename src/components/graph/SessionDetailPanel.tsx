'use client';

import { useSessionStore } from '@/stores/session-store';
import Badge from '@/components/shared/Badge';
import { formatDistanceToNow } from 'date-fns';
import { X } from 'lucide-react';

export default function SessionDetailPanel() {
  const sessions = useSessionStore((s) => s.sessions);
  const selectedId = useSessionStore((s) => s.selectedSessionId);
  const selectSession = useSessionStore((s) => s.selectSession);

  const session = sessions.find((s) => s.id === selectedId);

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center text-muted text-xs">
        select a session node
      </div>
    );
  }

  const rows: [string, React.ReactNode][] = [
    ['id', <span key="id" className="text-text font-mono">{session.id.slice(0, 12)}...</span>],
    [
      'status',
      <Badge key="status" variant={session.status === 'active' ? 'green' : 'red'}>
        {session.status}
      </Badge>,
    ],
    ['parent', session.parentId ? session.parentId.slice(0, 8) + '...' : 'root'],
    ['depth', String(session.depth)],
    ['turns', String(session.turnCount)],
    ['children', String(session.children.length)],
    ['refs', String(session.refs.length)],
    ['scope', session.scope ?? 'none'],
    [
      'created',
      formatDistanceToNow(new Date(session.createdAt), { addSuffix: true }),
    ],
    [
      'last_active',
      formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true }),
    ],
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border/70 px-5 py-4">
        <div className="mb-1 text-[10px] uppercase tracking-[0.24em] text-muted">selected session</div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">{session.label}</h2>
        <button
          onClick={() => selectSession(null)}
          className="text-muted hover:text-text transition-colors"
        >
          <X size={14} />
        </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {/* Metadata */}
        <section className="panel-inset rounded-2xl p-4">
          <h3 className="text-[10px] text-muted uppercase tracking-wider mb-2">session_detail</h3>
          <div className="space-y-1.5">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-white/[0.03] py-1.5 text-xs last:border-b-0">
                <span className="text-muted">{label}</span>
                <span className="text-text">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tags */}
        {session.tags.length > 0 && (
          <section className="panel-inset rounded-2xl p-4">
            <h3 className="text-[10px] text-muted uppercase tracking-wider mb-2">tags</h3>
            <div className="flex flex-wrap gap-1">
              {session.tags.map((tag) => (
                <Badge key={tag} variant="blue">{tag}</Badge>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
