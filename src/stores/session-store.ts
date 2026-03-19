'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { SessionMeta } from '@/types/session';

interface SessionState {
  sessions: SessionMeta[];
  selectedSessionId: string | null;
  currentSessionId: string | null;

  setSessions: (sessions: SessionMeta[]) => void;
  addSession: (session: SessionMeta) => void;
  updateSession: (id: string, updates: Partial<SessionMeta>) => void;
  selectSession: (id: string | null) => void;
  setCurrentSession: (id: string) => void;
}

export const useSessionStore = create<SessionState>()(
  immer((set) => ({
    sessions: [],
    selectedSessionId: null,
    currentSessionId: null,

    setSessions: (sessions) =>
      set((state) => {
        state.sessions = sessions;
      }),

    addSession: (session) =>
      set((state) => {
        state.sessions.push(session);
        const parent = state.sessions.find((s) => s.id === session.parentId);
        if (parent && !parent.children.includes(session.id)) {
          parent.children.push(session.id);
        }
      }),

    updateSession: (id, updates) =>
      set((state) => {
        const idx = state.sessions.findIndex((s) => s.id === id);
        if (idx !== -1) {
          Object.assign(state.sessions[idx]!, updates);
        }
      }),

    selectSession: (id) =>
      set((state) => {
        state.selectedSessionId = id;
      }),

    setCurrentSession: (id) =>
      set((state) => {
        state.currentSessionId = id;
      }),
  })),
);
