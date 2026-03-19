'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { clsx } from 'clsx';
import type { SessionMeta } from '@/types/session';

interface SessionNodeData {
  session: SessionMeta;
  color: string;
  isArchived: boolean;
  isSelected?: boolean;
  isCurrent?: boolean;
  size?: number;
}

function SessionNodeComponent({ data }: NodeProps) {
  const { session, color, isArchived, isSelected, isCurrent, size = 56 } =
    data as unknown as SessionNodeData;

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />

      {/* Glow ring */}
      {isSelected && (
        <div
          className="absolute -inset-3 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
          }}
        />
      )}

      {isCurrent && !isSelected && (
        <div
          className="absolute -inset-2 rounded-full"
          style={{
            border: `1px solid ${color}55`,
            boxShadow: `0 0 0 5px ${color}10`,
          }}
        />
      )}

      {/* Node circle */}
      <div
        className={clsx(
          'flex cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200',
          isArchived && 'opacity-40',
        )}
        style={{
          width: size,
          height: size,
          borderColor: color,
          background: `radial-gradient(circle at 30% 30%, ${color}45, ${color}18)`,
          boxShadow: `0 0 ${isSelected ? 24 : isCurrent ? 18 : 10}px ${color}40, inset 0 1px 0 rgba(255,255,255,0.12)`,
          transform: isSelected ? 'scale(1.08)' : isCurrent ? 'scale(1.03)' : 'scale(1)',
        }}
      >
        <span className="max-w-[48px] truncate text-[10px] font-semibold text-text">
          {session.label.slice(0, 4)}
        </span>
      </div>

      {/* Label below */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="rounded-full bg-black/45 px-2 py-0.5 text-[9px] text-muted transition-colors backdrop-blur-sm group-hover:text-text">
          {session.label}
        </span>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="panel-surface min-w-[148px] rounded-xl px-3 py-2 text-[10px] space-y-1">
          <div className="text-text font-medium">{session.label}</div>
          <div className="text-muted">id: {session.id.slice(0, 8)}...</div>
          <div className="text-muted">turns: {session.turnCount}</div>
          <div className="text-muted">depth: {session.depth}</div>
          <div className="text-muted">status: {session.status}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
    </div>
  );
}

export default memo(SessionNodeComponent);
