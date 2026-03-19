/** Stello Board color palette */
export const COLORS = {
  bg: '#0C0C0C',
  surface: '#1A1A1A',
  border: '#2A2A2A',
  muted: '#525252',
  text: '#E5E5E5',
  green: '#22C55E',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  amber: '#F59E0B',
  red: '#EF4444',
} as const;

/** Node color by depth */
export function colorByDepth(depth: number): string {
  if (depth === 0) return COLORS.green;
  if (depth === 1) return COLORS.blue;
  if (depth === 2) return COLORS.purple;
  return COLORS.muted;
}

/** Stello's 8 agent tools categorized */
export const TOOL_CATEGORIES = {
  read: ['stello_read_core', 'stello_read_summary', 'stello_list_sessions'],
  write: ['stello_update_core', 'stello_add_ref', 'stello_update_meta'],
  session: ['stello_create_session', 'stello_archive'],
} as const;

/** Lifecycle hook step order */
export const LIFECYCLE_STEPS = [
  'bootstrap',
  'ingest',
  'assemble',
  'llm_call',
  'afterTurn',
  'flushBubbles',
] as const;

/** WebSocket reconnect config */
export const WS_CONFIG = {
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
} as const;
