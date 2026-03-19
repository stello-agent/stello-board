'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TurnRecord } from '@/types/memory';

interface MemoryState {
  /** L1 core.json content */
  core: Record<string, unknown>;
  /** L1 changed fields for highlighting */
  coreChangedFields: string[];
  /** L2 memory.md per session */
  summaries: Record<string, string>;
  /** L3 records per session */
  records: Record<string, TurnRecord[]>;
  /** Currently viewed session ID */
  viewingSessionId: string | null;

  setCore: (core: Record<string, unknown>) => void;
  setCoreChanged: (fields: string[]) => void;
  setSummary: (sessionId: string, content: string) => void;
  setRecords: (sessionId: string, records: TurnRecord[]) => void;
  appendRecord: (sessionId: string, record: TurnRecord) => void;
  setViewingSession: (id: string | null) => void;
}

export const useMemoryStore = create<MemoryState>()(
  immer((set) => ({
    core: {},
    coreChangedFields: [],
    summaries: {},
    records: {},
    viewingSessionId: null,

    setCore: (core) =>
      set((state) => {
        state.core = core;
      }),

    setCoreChanged: (fields) =>
      set((state) => {
        state.coreChangedFields = fields;
      }),

    setSummary: (sessionId, content) =>
      set((state) => {
        state.summaries[sessionId] = content;
      }),

    setRecords: (sessionId, records) =>
      set((state) => {
        state.records[sessionId] = records;
      }),

    appendRecord: (sessionId, record) =>
      set((state) => {
        if (!state.records[sessionId]) {
          state.records[sessionId] = [];
        }
        state.records[sessionId].push(record);
      }),

    setViewingSession: (id) =>
      set((state) => {
        state.viewingSessionId = id;
      }),
  })),
);
