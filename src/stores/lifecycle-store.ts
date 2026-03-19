'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { LifecycleStep, TurnLifecycle } from '@/types/lifecycle';

interface LifecycleState {
  currentTurn: TurnLifecycle | null;
  history: TurnLifecycle[];

  setCurrentTurn: (turn: TurnLifecycle | null) => void;
  startTurn: (sessionId: string, turnNumber: number) => void;
  addStep: (step: LifecycleStep) => void;
  completeTurn: () => void;
  setHistory: (history: TurnLifecycle[]) => void;
}

export const useLifecycleStore = create<LifecycleState>()(
  immer((set) => ({
    currentTurn: null,
    history: [],

    setCurrentTurn: (turn) =>
      set((state) => {
        state.currentTurn = turn;
      }),

    startTurn: (sessionId, turnNumber) =>
      set((state) => {
        state.currentTurn = {
          sessionId,
          turnNumber,
          steps: [],
          startedAt: new Date().toISOString(),
        };
      }),

    addStep: (step) =>
      set((state) => {
        if (state.currentTurn) {
          state.currentTurn.steps.push(step);
        }
      }),

    completeTurn: () =>
      set((state) => {
        if (state.currentTurn) {
          state.currentTurn.completedAt = new Date().toISOString();
          state.history.push(state.currentTurn);
          state.currentTurn = null;
        }
      }),

    setHistory: (history) =>
      set((state) => {
        state.history = history;
      }),
  })),
);
