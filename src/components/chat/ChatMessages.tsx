'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chat-store';
import ChatBubble from './ChatBubble';
import SystemDivider from './SystemDivider';
import { ArrowDown } from 'lucide-react';
import { useState } from 'react';

export default function ChatMessages() {
  const items = useChatStore((s) => s.items);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items.length]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!isAtBottom);
  };

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-1 py-5"
      >
        {items.length === 0 && (
          <div className="flex h-full items-center justify-center px-8 text-center text-xs text-muted">
            start a conversation with the agent or type `/` to open command suggestions
          </div>
        )}

        {items.map((item) =>
          item.kind === 'message' ? (
            <ChatBubble key={item.data.id} message={item.data} />
          ) : (
            <SystemDivider key={item.data.id} event={item.data} />
          ),
        )}
        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="panel-inset absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-text"
        >
          <ArrowDown size={14} />
        </button>
      )}
    </div>
  );
}
