import type { SystemEvent } from '@/stores/chat-store';

interface SystemDividerProps {
  event: SystemEvent;
}

export default function SystemDivider({ event }: SystemDividerProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] text-amber whitespace-nowrap">
        {event.label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
