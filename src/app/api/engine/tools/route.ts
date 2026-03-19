import { NextResponse } from 'next/server';
import { hasExternalEngine, proxyEngineRequest } from '@/lib/engine-proxy';
import { getToolHistory } from '@/lib/stello-runtime';

export async function GET() {
  if (hasExternalEngine()) {
    const response = await proxyEngineRequest('/tools');
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  const calls = await getToolHistory();
  return NextResponse.json({ calls });
}
