'use client';

import { clsx } from 'clsx';
import { LIFECYCLE_STEPS } from '@/lib/constants';
import type { LifecycleStep } from '@/types/lifecycle';
import Badge from '@/components/shared/Badge';
import {
  Rocket,
  Download,
  Layers,
  Cpu,
  RotateCcw,
  Zap,
} from 'lucide-react';

const STEP_ICONS: Record<string, React.ElementType> = {
  bootstrap: Rocket,
  ingest: Download,
  assemble: Layers,
  llm_call: Cpu,
  afterTurn: RotateCcw,
  flushBubbles: Zap,
};

const STATUS_COLORS = {
  pending: 'bg-muted',
  running: 'bg-amber',
  completed: 'bg-accent',
  error: 'bg-red',
} as const;

interface TimelineProps {
  steps: LifecycleStep[];
  selectedStep: string | null;
  onSelectStep: (hook: string) => void;
}

export default function Timeline({ steps, selectedStep, onSelectStep }: TimelineProps) {
  const stepMap = new Map(steps.map((s) => [s.hook, s]));

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-6 py-4">
      {LIFECYCLE_STEPS.map((hookName, i) => {
        const step = stepMap.get(hookName);
        const status = step?.status ?? 'pending';
        const Icon = STEP_ICONS[hookName] ?? Cpu;
        const isActive = selectedStep === hookName;

        return (
          <div key={hookName} className="flex items-center">
            <button
              onClick={() => onSelectStep(hookName)}
              className={clsx(
                'flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg transition-all min-w-[90px]',
                isActive ? 'bg-surface border border-border' : 'hover:bg-surface/50',
              )}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  status === 'running' && 'animate-pulse',
                )}
                style={{
                  background:
                    status === 'completed'
                      ? '#22C55E20'
                      : status === 'running'
                        ? '#F59E0B20'
                        : status === 'error'
                          ? '#EF444420'
                          : '#52525220',
                }}
              >
                <Icon
                  size={14}
                  className={clsx({
                    'text-accent': status === 'completed',
                    'text-amber': status === 'running',
                    'text-red': status === 'error',
                    'text-muted': status === 'pending',
                  })}
                />
              </div>
              <span className="text-[10px] text-muted">{hookName}</span>
              {step?.duration !== undefined && (
                <Badge variant={status === 'error' ? 'red' : 'muted'}>
                  {step.duration}ms
                </Badge>
              )}
            </button>

            {/* Connector line */}
            {i < LIFECYCLE_STEPS.length - 1 && (
              <div className="flex items-center mx-1">
                <div
                  className={clsx(
                    'h-px w-8',
                    STATUS_COLORS[status],
                    status === 'running' && 'animate-pulse',
                  )}
                />
                <div className={clsx('w-1.5 h-1.5 rounded-full', STATUS_COLORS[status])} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
