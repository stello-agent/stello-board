'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Network,
  Clock,
  MessageSquare,
  Brain,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useWSStore } from '@/stores/ws-store';

const NAV_ITEMS = [
  { href: '/graph', icon: Network, label: 'graph' },
  { href: '/lifecycle', icon: Clock, label: 'lifecycle' },
  { href: '/chat', icon: MessageSquare, label: 'chat' },
  { href: '/memory', icon: Brain, label: 'memory' },
  { href: '/tools', icon: Wrench, label: 'tools' },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const wsStatus = useWSStore((s) => s.status);

  return (
    <aside
      className={clsx(
        'panel-surface relative m-3 mr-0 flex h-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl transition-all duration-200',
        collapsed ? 'w-[4.75rem]' : 'w-[14.5rem]',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-accent/12 to-transparent" />

      {/* Logo */}
      <div className={clsx(
        'flex h-16 border-b border-border/70 px-4',
        collapsed ? 'items-center justify-center' : 'items-center gap-3',
      )}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/18 text-accent shadow-[0_0_24px_rgba(34,197,94,0.18)]">
          <span className="text-xs font-bold">S</span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-semibold tracking-wide text-text">stello_board</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted">runtime studio</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={clsx('flex-1 px-3 py-3', collapsed && 'px-2.5')}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'group interactive-chrome relative mb-1 flex rounded-xl text-sm transition-all duration-150',
                collapsed ? 'justify-center px-0 py-2.5' : 'items-center gap-3 px-3 py-3',
                isActive
                  ? 'bg-accent/10 text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                  : 'text-muted hover:bg-white/[0.04] hover:text-text',
              )}
              title={collapsed ? label : undefined}
            >
              {isActive && !collapsed && (
                <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-accent" />
              )}
              <div className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150',
                isActive
                  ? 'border-accent/25 bg-accent/12 shadow-[0_0_16px_rgba(34,197,94,0.12)]'
                  : 'border-border/70 bg-black/10 group-hover:border-border-strong',
              )}>
                <Icon size={17} />
              </div>
              {!collapsed && <span className="font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Status + Collapse */}
      <div className="border-t border-border/70 p-3">
        <div className={clsx(
          'panel-inset rounded-xl',
          collapsed
            ? 'flex flex-col items-center gap-2 px-2 py-2.5'
            : 'flex items-center justify-between px-3 py-2.5',
        )}>
          <div className="flex items-center gap-2">
          <div
            className={clsx('w-2 h-2 rounded-full', {
              'bg-accent': wsStatus === 'connected',
              'bg-amber': wsStatus === 'connecting',
              'bg-red': wsStatus === 'error',
              'bg-muted': wsStatus === 'disconnected',
            })}
          />
            {!collapsed && (
              <span className="text-xs text-muted">{wsStatus}</span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={clsx(
              'interactive-chrome rounded-lg text-muted transition-all duration-150 hover:text-text',
              collapsed
                ? 'border border-border/70 bg-black/10 p-1.5 hover:border-accent/20 hover:bg-white/[0.04]'
                : 'px-1.5 py-1 hover:bg-white/[0.04]',
            )}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
