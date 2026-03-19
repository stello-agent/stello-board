/** Session status */
export type SessionStatus = 'active' | 'archived';

/** Session metadata — mirrors @stello-ai/core SessionMeta */
export interface SessionMeta {
  readonly id: string;
  parentId: string | null;
  children: string[];
  refs: string[];
  label: string;
  index: number;
  scope: string | null;
  status: SessionStatus;
  depth: number;
  turnCount: number;
  metadata: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}
