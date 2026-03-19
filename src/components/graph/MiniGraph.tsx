'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import { GraphChart, EffectScatterChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECharts, EChartsCoreOption } from 'echarts/core';
import { useSessionStore } from '@/stores/session-store';
import { computeGraphEdges, computeGraphNodes } from '@/lib/graph-layout';
import { normalizeSessionTree } from '@/lib/session-tree';

echarts.use([GraphChart, EffectScatterChart, CanvasRenderer]);

function alpha(hex: string, value: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${value})`;
}

export default function MiniGraph() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<ECharts | null>(null);
  const sessions = useSessionStore((s) => s.sessions);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const selectedId = useSessionStore((s) => s.selectedSessionId);
  const selectSession = useSessionStore((s) => s.selectSession);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);

  const normalized = useMemo(
    () => normalizeSessionTree(sessions, currentSessionId),
    [currentSessionId, sessions],
  );

  const graphNodes = useMemo(
    () => computeGraphNodes(normalized.sessions, { ringSpacing: 120 }),
    [normalized.sessions],
  );
  const graphEdges = useMemo(
    () =>
      computeGraphEdges(normalized.sessions, {
        selectedId,
        currentId: normalized.currentSessionId,
      }),
    [normalized.currentSessionId, normalized.sessions, selectedId],
  );

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, undefined, {
      renderer: 'canvas',
      useDirtyRect: true,
    });
    chartInstanceRef.current = chart;

    const handleResize = () => chart.resize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(chartRef.current);

    const clickHandler = (params: unknown) => {
      const payload = params as { dataType?: string; data?: { id?: string } };
      if (payload.dataType !== 'node' || !payload.data?.id) return;
      selectSession(payload.data.id);
      setCurrentSession(payload.data.id);
    };

    chart.on('click', clickHandler);

    return () => {
      observer.disconnect();
      chart.off('click', clickHandler);
      chart.dispose();
      chartInstanceRef.current = null;
    };
  }, [selectSession, setCurrentSession]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    const option: EChartsCoreOption = {
      backgroundColor: 'transparent',
      animationDuration: 400,
      animationEasing: 'cubicOut',
      series: [
        {
          type: 'graph',
          layout: 'none',
          roam: false,
          draggable: false,
          silent: false,
          edgeSymbol: ['none', 'none'],
          lineStyle: {
            curveness: 0.18,
          },
          label: {
            show: false,
          },
          emphasis: {
            focus: 'adjacency',
            scale: true,
          },
          data: graphNodes.map((node) => {
            const data = node.data as {
              color: string;
              size: number;
              session: { label: string };
            };
            const isSelected = node.id === selectedId;
            const isCurrent = node.id === normalized.currentSessionId;

            return {
              id: node.id,
              name: data.session.label,
              x: node.position.x,
              y: node.position.y,
              symbolSize: Math.max(16, Math.min(28, data.size * 0.42)),
              itemStyle: {
                color: new echarts.graphic.RadialGradient(0.35, 0.35, 0.85, [
                  { offset: 0, color: alpha('#ffffff', isSelected ? 0.2 : 0.12) },
                  { offset: 0.45, color: alpha(data.color, isSelected ? 0.95 : isCurrent ? 0.82 : 0.7) },
                  { offset: 1, color: alpha(data.color, isSelected ? 0.24 : 0.14) },
                ]),
                borderColor: data.color,
                borderWidth: isSelected ? 2.6 : isCurrent ? 2 : 1.6,
                shadowBlur: isSelected ? 18 : isCurrent ? 12 : 8,
                shadowColor: alpha(data.color, isSelected ? 0.8 : 0.45),
              },
            };
          }),
          links: graphEdges.map((edge) => ({
            source: edge.source,
            target: edge.target,
            lineStyle: edge.style
              ? {
                  color: typeof edge.style.stroke === 'string' ? edge.style.stroke : '#3a3a3a',
                  width: typeof edge.style.strokeWidth === 'number' ? Math.max(0.8, edge.style.strokeWidth - 0.3) : 1,
                  opacity: typeof edge.style.opacity === 'number' ? edge.style.opacity : 0.65,
                  type: typeof edge.style.strokeDasharray === 'string' ? 'dashed' : 'solid',
                }
              : undefined,
          })),
        },
      ],
    };

    chart.setOption(option, true);
    chart.resize();
  }, [graphEdges, graphNodes, normalized.currentSessionId, selectedId]);

  return (
    <div className="panel-inset h-52 w-full overflow-hidden rounded-2xl">
      <div ref={chartRef} className="h-full w-full" />
    </div>
  );
}
