'use client';

import { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function PageShell({ title, actions, children }: PageShellProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-border/70 bg-black/20 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="min-w-0">
            <div className="mb-1 text-[10px] uppercase tracking-[0.28em] text-muted">
              stello board
            </div>
            <h1 className="truncate text-base font-semibold text-text">{title}</h1>
          </div>
          {actions && <div className="ml-6 flex items-center gap-2">{actions}</div>}
        </div>
      </header>
      <main className="flex-1 overflow-hidden p-4 md:p-5">{children}</main>
    </div>
  );
}
