'use client';

import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import { useChatStore } from '@/stores/chat-store';
import { clsx } from 'clsx';

interface ChatInputProps {
  onSend: (message: string) => void;
}

type SuggestionItem =
  | {
      id: string;
      kind: 'command';
      value: string;
      title: string;
      description: string;
    }
  | {
      id: string;
      kind: 'session';
      value: string;
      title: string;
      description: string;
    };

const COMMANDS = [
  {
    name: '/help',
    description: 'show all available slash commands',
  },
  {
    name: '/sessions',
    description: 'list all known sessions',
  },
  {
    name: '/switch',
    description: 'switch to another session by label or id prefix',
  },
  {
    name: '/where',
    description: 'show the current active session',
  },
  {
    name: '/clear',
    description: 'clear the current chat panel',
  },
] as const;

export default function ChatInput({ onSend }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const sessions = useSessionStore((s) => s.sessions);

  const suggestions = useMemo<SuggestionItem[]>(() => {
    const trimmed = input.trimStart();
    if (!trimmed.startsWith('/')) return [];

    const lower = trimmed.toLowerCase();

    if (lower.startsWith('/switch')) {
      const query = trimmed.slice('/switch'.length).trim().toLowerCase();
      return sessions
        .filter((session) => {
          if (!query) return true;
          return (
            session.label.toLowerCase().includes(query) ||
            session.id.toLowerCase().startsWith(query)
          );
        })
        .slice(0, 8)
        .map((session) => ({
          id: session.id,
          kind: 'session' as const,
          value: `/switch ${session.label}`,
          title: session.label,
          description: `${session.id.slice(0, 8)} · depth ${session.depth} · ${session.status}`,
        }));
    }

    return COMMANDS
      .filter((command) => command.name.startsWith(lower) || lower === '/')
      .map((command) => ({
        id: command.name,
        kind: 'command' as const,
        value: command.name,
        title: command.name,
        description: command.description,
      }));
  }, [input, sessions]);

  const applySuggestion = useCallback(
    (suggestion: SuggestionItem, execute = false) => {
      if (execute) {
        onSend(suggestion.value);
        setInput('');
        setHighlightedIndex(0);
        return;
      }

      const nextValue = suggestion.kind === 'command' && suggestion.value === '/switch'
        ? '/switch '
        : `${suggestion.value}${suggestion.kind === 'command' ? ' ' : ''}`.trimEnd();

      setInput(nextValue);
      setHighlightedIndex(0);
    },
    [onSend],
  );

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput('');
    setHighlightedIndex(0);
  }, [input, isStreaming, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((current) => (current + 1) % suggestions.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions[highlightedIndex]!, false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border px-4 py-3 bg-surface">
      {currentSessionId && (
        <div className="text-[9px] text-muted mb-1.5">
          session: {currentSessionId.slice(0, 12)}...
        </div>
      )}
      <div className="flex items-end gap-2">
        <span className="text-accent text-sm font-bold pb-1.5">&gt;</span>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="type a message... or /switch <label|id>"
          rows={1}
          className="flex-1 bg-transparent text-text text-xs resize-none outline-none placeholder:text-muted py-1.5"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="interactive-chrome rounded-lg pb-1 text-accent hover:text-accent/80 disabled:text-muted disabled:hover:transform-none"
        >
          <Send size={16} />
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-lg border border-border bg-bg">
          <div className="border-b border-border px-3 py-2 text-[10px] text-muted">
            slash_commands · tab to apply · enter to run
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applySuggestion(suggestion, suggestion.kind === 'session')}
                className={clsx(
                  'interactive-chrome flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-xs',
                  highlightedIndex === index ? 'bg-surface' : 'hover:bg-surface/70',
                )}
              >
                <div className="min-w-0">
                  <div className="text-text">{suggestion.title}</div>
                  <div className="truncate text-[10px] text-muted">{suggestion.description}</div>
                </div>
                <div
                  className={clsx(
                    'shrink-0 rounded border px-1.5 py-0.5 text-[9px]',
                    suggestion.kind === 'session'
                      ? 'border-blue/30 text-blue'
                      : 'border-border text-muted',
                  )}
                >
                  {suggestion.kind}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
