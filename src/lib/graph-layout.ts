import type { SessionMeta } from '@/types/session';
import { colorByDepth } from './constants';
import type { Node, Edge } from '@xyflow/react';

/** Golden angle for natural distribution */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

interface LayoutConfig {
  centerX: number;
  centerY: number;
  ringSpacing: number;
}

const DEFAULTS: LayoutConfig = {
  centerX: 0,
  centerY: 0,
  ringSpacing: 180,
};

/** Node visual radius scales with turn count, with a smooth curve */
function nodeSize(turnCount: number) {
  // Base 48, logarithmic growth up to ~80 for heavily used sessions
  return Math.round(48 + 28 * (1 - 1 / (1 + turnCount * 0.3)));
}

/** Compute React Flow nodes from session data using constellation layout */
export function computeGraphNodes(
  sessions: SessionMeta[],
  config?: Partial<LayoutConfig>,
): Node[] {
  if (sessions.length === 0) return [];

  const c = { ...DEFAULTS, ...config };

  const depthGroups = new Map<number, SessionMeta[]>();
  for (const s of sessions) {
    const group = depthGroups.get(s.depth) ?? [];
    group.push(s);
    depthGroups.set(s.depth, group);
  }

  for (const group of depthGroups.values()) {
    group.sort((a, b) => a.index - b.index);
  }

  const nodes: Node[] = [];

  for (const [depth, group] of depthGroups) {
    const count = group.length;

    for (let i = 0; i < count; i++) {
      const session = group[i]!;
      let x: number;
      let y: number;

      if (depth === 0) {
        x = c.centerX;
        y = c.centerY;
      } else {
        const radius = depth * c.ringSpacing;
        const angle = count === 1
          ? 0
          : i * ((2 * Math.PI) / count) + depth * GOLDEN_ANGLE;
        x = c.centerX + radius * Math.cos(angle);
        y = c.centerY + radius * Math.sin(angle);
      }

      nodes.push({
        id: session.id,
        type: 'session',
        position: { x, y },
        style: {
          width: nodeSize(session.turnCount),
          height: nodeSize(session.turnCount),
        },
        data: {
          session,
          color: session.status === 'archived' ? '#6B7280' : colorByDepth(session.depth),
          isArchived: session.status === 'archived',
          size: nodeSize(session.turnCount),
        },
      });
    }
  }

  return nodes;
}

/** Compute React Flow edges from session data */
export function computeGraphEdges(
  sessions: SessionMeta[],
  options?: { selectedId?: string | null; currentId?: string | null },
): Edge[] {
  const edges: Edge[] = [];
  const selectedId = options?.selectedId ?? null;
  const currentId = options?.currentId ?? null;

  for (const session of sessions) {
    if (session.parentId) {
      const isHighlighted =
        session.id === selectedId ||
        session.parentId === selectedId ||
        session.id === currentId ||
        session.parentId === currentId;

      edges.push({
        id: `e-${session.parentId}-${session.id}`,
        source: session.parentId,
        target: session.id,
        type: 'default',
        style: {
          stroke: isHighlighted ? '#3ddc84' : '#3a3a3a',
          strokeWidth: isHighlighted ? 2 : 1.35,
          opacity: isHighlighted ? 0.92 : 0.48,
        },
        animated: false,
      });
    }

    for (const refId of session.refs) {
      const isHighlighted = session.id === selectedId || refId === selectedId;
      edges.push({
        id: `ref-${session.id}-${refId}`,
        source: session.id,
        target: refId,
        type: 'default',
        style: {
          stroke: isHighlighted ? '#FBBF24' : '#F59E0B',
          strokeWidth: isHighlighted ? 1.6 : 1,
          strokeDasharray: '5 5',
          opacity: isHighlighted ? 0.95 : 0.6,
        },
      });
    }
  }

  return edges;
}
