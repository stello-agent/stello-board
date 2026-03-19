'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TurnRecord } from '@/types/memory';

export interface ChatMessage extends TurnRecord {
  id: string;
  sessionId: string;
  toolCalls?: InlineToolCall[];
}

export interface InlineToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  duration?: number;
  status: 'pending' | 'success' | 'error';
}

export interface SystemEvent {
  id: string;
  type: string;
  label: string;
  timestamp: string;
}

type ChatItem = { kind: 'message'; data: ChatMessage } | { kind: 'event'; data: SystemEvent };

interface ChatState {
  items: ChatItem[];
  isStreaming: boolean;

  setItems: (items: ChatItem[]) => void;
  addMessage: (msg: ChatMessage) => void;
  addSystemEvent: (event: SystemEvent) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  immer((set) => ({
    items: [],
    isStreaming: false,

    setItems: (items) =>
      set((state) => {
        state.items = items;
      }),

    addMessage: (msg) =>
      set((state) => {
        state.items.push({ kind: 'message', data: msg });
      }),

    addSystemEvent: (event) =>
      set((state) => {
        state.items.push({ kind: 'event', data: event });
      }),

    setStreaming: (streaming) =>
      set((state) => {
        state.isStreaming = streaming;
      }),

    clearMessages: () =>
      set((state) => {
        state.items = [];
      }),
  })),
);
