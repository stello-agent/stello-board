import 'server-only';

const ENGINE_URL = process.env.STELLO_ENGINE_URL?.replace(/\/$/, '') ?? '';
const ENGINE_PREFIX = process.env.STELLO_ENGINE_PREFIX?.replace(/\/$/, '') ?? '/api/engine';

export function hasExternalEngine() {
  return ENGINE_URL.length > 0;
}

export function externalEngineTarget(pathname: string) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${ENGINE_URL}${ENGINE_PREFIX}${normalizedPath}`;
}

export async function proxyEngineRequest(
  pathname: string,
  init?: RequestInit,
): Promise<Response> {
  if (!hasExternalEngine()) {
    throw new Error('External engine is not configured');
  }

  return fetch(externalEngineTarget(pathname), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
}
