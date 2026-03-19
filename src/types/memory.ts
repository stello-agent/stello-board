/** L3 turn record */
export interface TurnRecord {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** Assembled context from the engine */
export interface AssembledContext {
  core: Record<string, unknown>;
  memories: string[];
  currentMemory: string | null;
  scope: string | null;
}

/** Inheritance policy options */
export type InheritancePolicy = 'full' | 'summary' | 'minimal' | 'scoped';
