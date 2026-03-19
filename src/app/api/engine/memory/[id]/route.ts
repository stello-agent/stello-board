import { NextResponse } from 'next/server';
import { hasExternalEngine, proxyEngineRequest } from '@/lib/engine-proxy';
import { getSessionMemory } from '@/lib/stello-runtime';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params;

  if (hasExternalEngine()) {
    const response = await proxyEngineRequest(`/memory/${id}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  const payload = await getSessionMemory(id);
  return NextResponse.json(payload);
}
