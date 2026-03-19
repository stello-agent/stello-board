import { NextResponse } from 'next/server';
import { hasExternalEngine, proxyEngineRequest } from '@/lib/engine-proxy';
import { getSessionDetail } from '@/lib/stello-runtime';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params;

  if (hasExternalEngine()) {
    const response = await proxyEngineRequest(`/sessions/${id}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  const detail = await getSessionDetail(id);

  if (!detail) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }

  return NextResponse.json(detail);
}
