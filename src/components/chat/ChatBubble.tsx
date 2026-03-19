'use client';

import { clsx } from 'clsx';
import type { ChatMessage, InlineToolCall } from '@/stores/chat-store';
import Badge from '@/components/shared/Badge';
import CodeBlock from '@/components/shared/CodeBlock';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useState } from 'react';

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={clsx('flex gap-3 px-5 py-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={clsx(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border text-[10px] font-bold shadow-[0_8px_18px_rgba(0,0,0,0.18)]',
          isUser
            ? 'border-border/70 bg-white/[0.04] text-text'
            : 'border-accent/20 bg-accent/14 text-accent',
        )}
      >
        {isUser ? 'U' : 'A'}
      </div>

      {/* Content */}
      <div
        className={clsx(
          'max-w-[78%] rounded-2xl border px-4 py-3 text-xs leading-relaxed shadow-[0_12px_30px_rgba(0,0,0,0.16)]',
          isUser
            ? 'border-border/70 bg-white/[0.04] text-text'
            : 'border-accent/10 bg-gradient-to-br from-accent/8 to-transparent text-text',
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Inline tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallCard({ toolCall }: { toolCall: InlineToolCall }) {
  const [expanded, setExpanded] = useState(false);

  const StatusIcon =
    toolCall.status === 'success'
      ? CheckCircle
      : toolCall.status === 'error'
        ? XCircle
        : Loader;

  return (
    <div className="panel-inset rounded-xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-[10px]"
      >
        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <StatusIcon
          size={10}
          className={clsx({
            'text-accent': toolCall.status === 'success',
            'text-red': toolCall.status === 'error',
            'text-amber animate-spin': toolCall.status === 'pending',
          })}
        />
        <span className="text-accent font-medium">{toolCall.name}</span>
        {toolCall.duration !== undefined && (
          <Badge variant="muted">{toolCall.duration}ms</Badge>
        )}
      </button>

      {expanded && (
        <div className="space-y-1 px-3 pb-3">
          <CodeBlock code={JSON.stringify(toolCall.args, null, 2)} language="json" />
          {toolCall.result !== undefined && (
            <CodeBlock code={JSON.stringify(toolCall.result, null, 2)} language="json" />
          )}
          {toolCall.error && (
            <p className="text-red text-[10px]">{toolCall.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
