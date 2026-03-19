import { NextResponse } from 'next/server';
import { hasExternalEngine, proxyEngineRequest } from '@/lib/engine-proxy';
import { listSessions } from '@/lib/stello-runtime';

export async function GET() {
  if (hasExternalEngine()) {
    const response = await proxyEngineRequest('/sessions');
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  const payload = await listSessions();
  return NextResponse.json(payload);
}
