'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ToolCallWithResult } from '@/types/tool';

interface ToolState {
  calls: ToolCallWithResult[];
  filter: 'all' | 'read' | 'write' | 'session' | 'failed';

  addCall: (call: ToolCallWithResult) => void;
  updateCallResult: (toolCallId: string, result: ToolCallWithResult['result']) => void;
  setCalls: (calls: ToolCallWithResult[]) => void;
  setFilter: (filter: ToolState['filter']) => void;
}

export const useToolStore = create<ToolState>()(
  immer((set) => ({
    calls: [],
    filter: 'all',

    addCall: (call) =>
      set((state) => {
        state.calls.unshift(call);
      }),

    updateCallResult: (toolCallId, result) =>
      set((state) => {
        const call = state.calls.find((c) => c.id === toolCallId);
        if (call) {
          call.result = result;
        }
      }),

    setCalls: (calls) =>
      set((state) => {
        state.calls = calls;
      }),

    setFilter: (filter) =>
      set((state) => {
        state.filter = filter;
      }),
  })),
);
