/** Lifecycle step status */
export type StepStatus = 'pending' | 'running' | 'completed' | 'error';

/** Single lifecycle step */
export interface LifecycleStep {
  hook: string;
  phase: 'start' | 'end';
  status: StepStatus;
  duration?: number;
  error?: string;
  timestamp: string;
  inputData?: unknown;
  outputData?: unknown;
}

/** A full turn's lifecycle */
export interface TurnLifecycle {
  sessionId: string;
  turnNumber: number;
  steps: LifecycleStep[];
  startedAt: string;
  completedAt?: string;
}
