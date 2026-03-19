'use client';

import { create } from 'zustand';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface WSState {
  status: ConnectionStatus;
  reconnectAttempts: number;

  setStatus: (status: ConnectionStatus) => void;
  incrementReconnect: () => void;
  resetReconnect: () => void;
}

export const useWSStore = create<WSState>()((set) => ({
  status: 'disconnected',
  reconnectAttempts: 0,

  setStatus: (status) => set({ status }),
  incrementReconnect: () => set((s) => ({ reconnectAttempts: s.reconnectAttempts + 1 })),
  resetReconnect: () => set({ reconnectAttempts: 0 }),
}));
