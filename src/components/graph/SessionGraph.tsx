'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  LocateFixed,
  Focus,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  Network,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as echarts from 'echarts/core';
import { GraphChart, EffectScatterChart } from 'echarts/charts';
import {
  TooltipComponent,
  LegendComponent,
  GraphicComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECharts, EChartsCoreOption } from 'echarts/core';
import { useSessionStore } from '@/stores/session-store';
import { useMemoryStore } from '@/stores/memory-store';
import { computeGraphEdges, computeGraphNodes } from '@/lib/graph-layout';
import { colorByDepth, COLORS } from '@/lib/constants';
import Badge from '@/components/shared/Badge';

echarts.use([
  GraphChart,
  EffectScatterChart,
  TooltipComponent,
  LegendComponent,
  GraphicComponent,
  CanvasRenderer,
]);

// ── node gradient helper ──
function gradientForNode(color: string, selected: boolean, current: boolean) {
  const glow = selected ? 0.85 : current ? 0.65 : 0.45;
  const edge = selected ? 0.3 : current ? 0.2 : 0.08;

  return new echarts.graphic.RadialGradient(0.32, 0.32, 0.85, [
    { offset: 0, color: `rgba(255,255,255,${glow * 0.4})` },
    { offset: 0.35, color: hexAlpha(color, glow) },
    { offset: 0.7, color: hexAlpha(color, glow * 0.5) },
    { offset: 1, color: hexAlpha(color, edge) },
  ]);
}

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── depth ring painter (background concentric guides) ──
function buildDepthRings(
  maxDepth: number,
  ringSpacing: number,
  cx: number,
  cy: number,
): unknown[] {
  const rings: unknown[] = [];
  for (let d = 1; d <= maxDepth; d++) {
    const r = d * ringSpacing;
    rings.push({
      type: 'circle' as const,
      shape: { cx, cy, r },
      style: {
        fill: 'none',
        stroke: `rgba(255,255,255,${0.025 / d})`,
        lineWidth: 1,
        lineDash: [4, 8],
      },
      silent: true,
      z: 0,
    });
  }
  return rings;
}

// ── rich tooltip html ──
function tooltipHtml(session: {
  label: string;
  id: string;
  depth: number;
  turnCount: number;
  status: string;
  scope?: string | null;
  children?: string[];
  refs?: string[];
}) {
  const color = session.status === 'archived' ? COLORS.muted : colorByDepth(session.depth);
  const statusDot = `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${
    session.status === 'active' ? COLORS.green : COLORS.red
  };margin-right:6px;vertical-align:middle;box-shadow:0 0 6px ${
    session.status === 'active' ? COLORS.green : COLORS.red
  }55;"></span>`;

  return `
    <div style="min-width:180px;padding:2px 0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color}80;"></div>
        <span style="font-weight:700;font-size:12px;letter-spacing:0.02em;">${session.label}</span>
      </div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:10px;opacity:0.85;">
        <span style="color:#888;">id</span><span style="font-family:monospace;">${session.id.slice(0, 10)}...</span>
        <span style="color:#888;">status</span><span>${statusDot}${session.status}</span>
        <span style="color:#888;">depth</span><span>${session.depth}</span>
        <span style="color:#888;">turns</span><span>${session.turnCount}</span>
        ${session.scope ? `<span style="color:#888;">scope</span><span>${session.scope}</span>` : ''}
        ${session.children?.length ? `<span style="color:#888;">children</span><span>${session.children.length}</span>` : ''}
        ${session.refs?.length ? `<span style="color:#888;">refs</span><span>${session.refs.length}</span>` : ''}
      </div>
      <div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06);font-size:9px;color:#666;">
        click to select · dbl-click to chat
      </div>
    </div>`;
}

export default function SessionGraph() {
  const router = useRouter();
  const chartRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<ECharts | null>(null);
  const sessions = useSessionStore((s) => s.sessions);
  const selectedId = useSessionStore((s) => s.selectedSessionId);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const selectSession = useSessionStore((s) => s.selectSession);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);
  const setViewingSession = useMemoryStore((s) => s.setViewingSession);
  const [query, setQuery] = useState('');
  const [controlsOpen, setControlsOpen] = useState(false);
  const [viewVersion, setViewVersion] = useState(0);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

  // ── filter sessions ──
  const visibleSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sessions;

    const byId = new Map(sessions.map((s) => [s.id, s]));
    const visibleIds = new Set<string>();

    for (const session of sessions) {
      const matches =
        session.label.toLowerCase().includes(normalized) ||
        session.id.toLowerCase().startsWith(normalized) ||
        session.scope?.toLowerCase().includes(normalized) ||
        session.tags.some((tag) => tag.toLowerCase().includes(normalized));

      if (!matches) continue;
      visibleIds.add(session.id);
      let pid = session.parentId;
      while (pid) {
        visibleIds.add(pid);
        pid = byId.get(pid)?.parentId ?? null;
      }
    }

    return sessions.filter((s) => visibleIds.has(s.id));
  }, [query, sessions]);

  const graphNodes = useMemo(() => computeGraphNodes(visibleSessions), [visibleSessions]);
  const graphEdges = useMemo(
    () => computeGraphEdges(visibleSessions, { selectedId, currentId: currentSessionId }),
    [currentSessionId, selectedId, visibleSessions],
  );

  // ── depth stats ──
  const depthStats = useMemo(() => {
    const map = new Map<number, number>();
    for (const s of visibleSessions) {
      map.set(s.depth, (map.get(s.depth) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [visibleSessions]);

  const maxDepth = depthStats.length > 0 ? depthStats[depthStats.length - 1]![0] : 0;

  // ── zoom to node ──
  const focusNode = useCallback(
    (nodeId: string) => {
      const chart = echartsRef.current;
      const node = graphNodes.find((n) => n.id === nodeId);
      if (!chart || !node) return;

      const dataIndex = graphNodes.indexOf(node);
      chart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
      chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex });
      chart.dispatchAction({ type: 'focusNodeAdjacency', seriesIndex: 0, dataIndex });
      chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex });
    },
    [graphNodes],
  );

  // ── init chart ──
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, undefined, {
      renderer: 'canvas',
      useDirtyRect: true,
    });
    echartsRef.current = chart;

    const handleResize = () => chart.resize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(chartRef.current);

    const clickHandler = (params: unknown) => {
      const p = params as { dataType?: string; data?: { id?: string } };
      if (p.dataType !== 'node' || !p.data?.id) return;
      selectSession(p.data.id);
      setCurrentSession(p.data.id);
    };

    const dblClickHandler = (params: unknown) => {
      const p = params as { dataType?: string; data?: { id?: string } };
      if (p.dataType !== 'node' || !p.data?.id) return;
      setCurrentSession(p.data.id);
      selectSession(p.data.id);
      setViewingSession(p.data.id);
      router.push('/chat');
    };

    chart.on('click', clickHandler);
    chart.on('dblclick', dblClickHandler);

    return () => {
      observer.disconnect();
      chart.off('click', clickHandler);
      chart.off('dblclick', dblClickHandler);
      chart.dispose();
      echartsRef.current = null;
    };
  }, [router, selectSession, setCurrentSession, setViewingSession, viewVersion]);

  // ── update option ──
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart) return;

    const ringSpacing = 180;
    const depthRings = buildDepthRings(maxDepth, ringSpacing, 0, 0);

    const option: EChartsCoreOption = {
      backgroundColor: 'transparent',
      animationDuration: 800,
      animationDurationUpdate: 400,
      animationEasing: 'cubicInOut',
      animationEasingUpdate: 'cubicInOut',
      graphic: depthRings,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(12, 12, 12, 0.97)',
        borderColor: 'rgba(58, 58, 58, 0.7)',
        borderWidth: 1,
        borderRadius: 12,
        padding: [12, 14],
        extraCssText:
          'backdrop-filter:blur(12px);box-shadow:0 24px 64px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.04);',
        textStyle: {
          color: '#E5E5E5',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
        },
        formatter: (params: unknown) => {
          const p = params as {
            dataType?: string;
            data?: { session?: Parameters<typeof tooltipHtml>[0] };
          };
          if (p.dataType !== 'node' || !p.data?.session) return '';
          return tooltipHtml(p.data.session);
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'none',
          roam: true,
          zoom: 1.05,
          draggable: true,
          cursor: 'pointer',
          emphasis: {
            focus: 'adjacency',
            scale: true,
            scaleSize: 6,
            lineStyle: { width: 3 },
            itemStyle: {
              shadowBlur: 40,
            },
          },
          blur: {
            itemStyle: { opacity: 0.25 },
            lineStyle: { opacity: 0.08 },
            label: { opacity: 0.3 },
          },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [0, 6],
          lineStyle: {
            curveness: 0.22,
            cap: 'round',
          },
          label: {
            show: true,
            position: 'bottom',
            distance: 14,
            color: '#777',
            fontSize: 10,
            fontFamily: '"JetBrains Mono", monospace',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 999,
            padding: [4, 10],
            borderColor: 'rgba(255,255,255,0.04)',
            borderWidth: 1,
          },
          selectedMode: 'single',
          select: {
            itemStyle: {
              shadowBlur: 48,
            },
          },
          data: graphNodes.map((node) => {
            const data = node.data as {
              session: {
                id: string;
                label: string;
                depth: number;
                turnCount: number;
                status: string;
                scope?: string | null;
                children?: string[];
                refs?: string[];
              };
              color: string;
              size: number;
              isArchived: boolean;
            };
            const isSelected = node.id === selectedId;
            const isCurrent = node.id === currentSessionId;

            const symbolSize = data.size * (isSelected ? 1.15 : isCurrent ? 1.08 : 1);

            return {
              id: node.id,
              name: data.session.label,
              session: data.session,
              x: node.position.x,
              y: node.position.y,
              symbolSize,
              symbol: 'circle',
              selected: isSelected,
              itemStyle: {
                color: gradientForNode(data.color, isSelected, isCurrent),
                borderColor: isSelected
                  ? '#fff'
                  : isCurrent
                    ? data.color
                    : hexAlpha(data.color, 0.7),
                borderWidth: isSelected ? 2.5 : isCurrent ? 2 : 1.5,
                shadowBlur: isSelected ? 44 : isCurrent ? 28 : 14,
                shadowColor: hexAlpha(data.color, isSelected ? 0.7 : isCurrent ? 0.5 : 0.3),
                opacity: data.isArchived ? 0.35 : 1,
                decal: isSelected
                  ? {
                      symbol: 'circle',
                      symbolSize: 1,
                      color: 'rgba(255,255,255,0.06)',
                    }
                  : undefined,
              },
              label: {
                formatter: data.session.label,
                color: isSelected ? '#F0F0F0' : isCurrent ? '#BBB' : '#777',
                fontWeight: isSelected ? 700 : 400,
                backgroundColor: isSelected
                  ? 'rgba(34,197,94,0.12)'
                  : 'rgba(0,0,0,0.5)',
                borderColor: isSelected
                  ? 'rgba(34,197,94,0.2)'
                  : 'rgba(255,255,255,0.04)',
              },
              z: isSelected ? 20 : isCurrent ? 15 : data.session.depth === 0 ? 10 : 5,
            };
          }),
          links: graphEdges.map((edge) => {
            const isRef = edge.id.startsWith('ref-');
            const style = edge.style as {
              stroke?: string;
              strokeWidth?: number;
              opacity?: number;
              strokeDasharray?: string;
            } | undefined;

            return {
              source: edge.source,
              target: edge.target,
              lineStyle: {
                color: style?.stroke ?? '#3a3a3a',
                width: style?.strokeWidth ?? 1.2,
                opacity: style?.opacity ?? 0.5,
                type: isRef ? ([5, 5] as [number, number]) : ('solid' as const),
                curveness: isRef ? 0.35 : 0.22,
              },
              emphasis: {
                lineStyle: {
                  width: (style?.strokeWidth ?? 1.2) + 1.5,
                  opacity: 1,
                  shadowBlur: 8,
                  shadowColor: style?.stroke ?? '#3a3a3a',
                },
              },
            };
          }),
        },
        // Ripple effect scatter for current session
        ...(currentSessionId
          ? [
              {
                type: 'effectScatter' as const,
                coordinateSystem: undefined,
                data: graphNodes
                  .filter((n) => n.id === currentSessionId)
                  .map((n) => {
                    const data = n.data as { color: string; size: number };
                    return {
                      value: [n.position.x, n.position.y],
                      symbolSize: data.size * 0.6,
                      itemStyle: {
                        color: hexAlpha(data.color, 0.15),
                      },
                    };
                  }),
                rippleEffect: {
                  brushType: 'stroke',
                  period: 3,
                  scale: 4,
                  color: (() => {
                    const node = graphNodes.find((n) => n.id === currentSessionId);
                    const data = node?.data as { color: string } | undefined;
                    return hexAlpha(data?.color ?? COLORS.green, 0.3);
                  })(),
                },
                z: 1,
                silent: true,
              },
            ]
          : []),
      ],
    };

    chart.setOption(option, true);
    chart.resize();
  }, [currentSessionId, graphEdges, graphNodes, maxDepth, selectedId, viewVersion]);

  useEffect(() => {
    if (!pendingFocusId) return;
    const id = window.setTimeout(() => {
      focusNode(pendingFocusId);
      setPendingFocusId(null);
    }, 60);
    return () => window.clearTimeout(id);
  }, [focusNode, pendingFocusId, viewVersion]);

  // ── empty state ──
  if (sessions.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-accent/5 blur-2xl" />
          <Network size={48} className="relative text-muted/40" />
        </div>
        <div className="text-center">
          <p className="text-sm text-muted">no sessions yet</p>
          <p className="mt-1 text-[10px] text-muted/60">
            connect to a stello engine to visualize the session tree
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      {/* ECharts canvas */}
      <div ref={chartRef} className="h-full w-full" />

      {/* Top gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/15 to-transparent" />

      {/* ── Controls overlay ── */}
      <div className="absolute left-4 top-4 flex flex-col gap-2">
        {/* Toolbar */}
        <div className="panel-surface flex items-center gap-2 rounded-2xl px-3 py-2">
          <button
            onClick={() => setControlsOpen((v) => !v)}
            className="panel-inset interactive-chrome interactive-accent inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-text hover:bg-white/[0.06]"
          >
            <SlidersHorizontal size={13} />
            {controlsOpen ? 'hide' : 'controls'}
          </button>
          <Badge variant="green">{sessions.length} sessions</Badge>
          {query && <Badge variant="blue">{visibleSessions.length} visible</Badge>}
        </div>

        {/* Expanded controls */}
        {controlsOpen && (
          <div className="panel-surface flex w-[22rem] flex-col gap-3 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-muted">
                  <Sparkles size={10} />
                  graph tools
                </div>
                <div className="mt-1 text-sm font-semibold text-text">session constellation</div>
              </div>
              <button
                onClick={() => setControlsOpen(false)}
                className="interactive-chrome rounded-lg p-1 text-muted hover:bg-white/[0.04] hover:text-text"
              >
                <X size={12} />
              </button>
            </div>

            {/* Search */}
            <div className="panel-inset flex items-center gap-2 rounded-xl px-3 py-2.5">
              <Search size={14} className="text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search label, id, tag, scope..."
                className="w-full bg-transparent text-xs text-text outline-none placeholder:text-muted"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="interactive-chrome rounded-md p-0.5 text-muted hover:bg-white/[0.04] hover:text-text"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQuery('');
                  setPendingFocusId(null);
                  setViewVersion((v) => v + 1);
                }}
                className="panel-inset interactive-chrome inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-text hover:bg-white/[0.06]"
              >
                <Focus size={13} />
                reset_view
              </button>
              {currentSessionId && (
                <button
                  onClick={() => {
                    setQuery('');
                    setPendingFocusId(currentSessionId);
                    setViewVersion((v) => v + 1);
                  }}
                  className="panel-inset interactive-chrome interactive-accent inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-accent hover:bg-accent/[0.06]"
                >
                  <LocateFixed size={13} />
                  locate_current
                </button>
              )}
            </div>

            {/* Depth legend */}
            {depthStats.length > 0 && (
              <div className="panel-inset rounded-xl px-3 py-2.5">
                <div className="mb-2 text-[9px] uppercase tracking-wider text-muted">depth legend</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {depthStats.map(([depth, count]) => {
                    const c = colorByDepth(depth);
                    return (
                      <div key={depth} className="flex items-center gap-1.5 text-[10px]">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background: c,
                            boxShadow: `0 0 6px ${c}60`,
                          }}
                        />
                        <span className="text-text-soft">L{depth}</span>
                        <span className="text-muted">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hints */}
            <div className="grid gap-1.5 text-[10px] text-muted">
              <div className="panel-inset rounded-xl px-3 py-2">
                click to select · drag to pan · scroll to zoom
              </div>
              <div className="panel-inset flex items-center justify-between rounded-xl px-3 py-2">
                <span>double click to open chat thread</span>
                <ArrowUpRight size={12} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom-right stats ── */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {currentSessionId && (
          <div className="panel-surface flex items-center gap-2 rounded-xl px-3 py-1.5 text-[10px]">
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span className="text-muted">current:</span>
            <span className="text-text">
              {sessions.find((s) => s.id === currentSessionId)?.label ?? currentSessionId.slice(0, 8)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
