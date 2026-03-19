import type { SessionMeta } from '@/types/session';
import type { TurnRecord } from '@/types/memory';
import type { ToolCall, ToolResult } from '@/types/tool';

/** All WebSocket event types */
export type WSEvent =
  | { type: 'session:created'; data: SessionMeta }
  | { type: 'session:switched'; data: { from: string; to: string } }
  | { type: 'session:archived'; data: { sessionId: string } }
  | { type: 'lifecycle:step'; data: { hook: string; phase: 'start' | 'end'; duration?: number } }
  | { type: 'memory:l1:changed'; data: { fields: string[] } }
  | { type: 'memory:l2:compacted'; data: { sessionId: string } }
  | { type: 'memory:l3:appended'; data: { sessionId: string; record: TurnRecord } }
  | { type: 'tool:called'; data: ToolCall }
  | { type: 'tool:result'; data: ToolResult }
  | { type: 'proposal:split'; data: SplitProposal }
  | { type: 'proposal:update'; data: UpdateProposal }
  | { type: 'bubble:flushed'; data: { fields: string[]; targets: string[] } };

/** Split proposal from SplitGuard */
export interface SplitProposal {
  id: string;
  parentId: string;
  suggestedLabel: string;
  suggestedScope?: string;
  reason: string;
}

/** L1 update proposal */
export interface UpdateProposal {
  id: string;
  path: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
}
