import { NextResponse } from 'next/server';
import { hasExternalEngine, proxyEngineRequest } from '@/lib/engine-proxy';
import { runTurn } from '@/lib/stello-runtime';

export async function POST(request: Request) {
  const body = (await request.json()) as { sessionId?: string; message?: string };

  if (!body.sessionId || !body.message) {
    return NextResponse.json({ error: 'sessionId_and_message_required' }, { status: 400 });
  }

  if (hasExternalEngine()) {
    const response = await proxyEngineRequest('/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  const payload = await runTurn(body.sessionId, body.message);
  return NextResponse.json(payload);
}
