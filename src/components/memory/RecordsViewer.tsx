'use client';

import { useMemoryStore } from '@/stores/memory-store';
import Badge from '@/components/shared/Badge';
import { formatDistanceToNow } from 'date-fns';

export default function RecordsViewer() {
  const viewingId = useMemoryStore((s) => s.viewingSessionId);
  const allRecords = useMemoryStore((s) => s.records);

  const records = viewingId ? allRecords[viewingId] ?? [] : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-purple">L3 records.jsonl</h3>
          <Badge variant="purple">{records.length} records</Badge>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-5">
        {records.length === 0 ? (
          <div className="text-xs text-muted text-center py-8">
            {viewingId ? 'no records' : 'select a session'}
          </div>
        ) : (
          records.map((record, i) => (
            <div
              key={i}
              className="panel-inset rounded-2xl p-3.5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    record.role === 'user'
                      ? 'blue'
                      : record.role === 'assistant'
                        ? 'green'
                        : 'muted'
                  }
                >
                  {record.role}
                </Badge>
                <span className="text-[10px] text-muted">
                  {formatDistanceToNow(new Date(record.timestamp), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-text leading-relaxed line-clamp-3">
                {record.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
