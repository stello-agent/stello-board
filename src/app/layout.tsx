import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import EngineBootstrap from '@/components/providers/EngineBootstrap';

export const metadata: Metadata = {
  title: 'Stello Board',
  description: 'Visual debugger for Stello Agent SDK',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex font-mono bg-bg text-text antialiased">
        <EngineBootstrap />
        <Sidebar />
        <div className="flex-1 overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
