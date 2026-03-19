# stello-board

Developer-facing visual frontend for the Stello agent SDK runtime.

[中文说明](./README.zh-CN.md)

It provides a graph view, chat view, memory inspector, lifecycle timeline, and tool log for a running Stello engine. The frontend keeps its own stable API shape under `/api/engine/*` and can work in two modes:

- external engine mode: proxy requests to a separate Stello backend
- local fallback mode: use the built-in mock runtime for UI development

## Current status

Implemented:

- session graph page
- chat page with turn submission
- memory inspector
- lifecycle timeline
- tool call log
- proxy-compatible backend routes under `/api/engine/*`
- fallback mock runtime backed by `@stello-ai/core`

Not implemented yet:

- WebSocket or SSE live sync
- split confirm dialog
- command palette and keyboard shortcuts
- production auth / multi-user concerns

## Getting started

Install dependencies:

```bash
pnpm install
```

Start development:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

## External engine integration

Create `.env.local`:

```bash
STELLO_ENGINE_URL=http://127.0.0.1:3001
STELLO_ENGINE_PREFIX=/api/engine
```

Meaning:

- `STELLO_ENGINE_URL`: origin of your external Stello backend
- `STELLO_ENGINE_PREFIX`: path prefix on that backend, default `/api/engine`

When `STELLO_ENGINE_URL` is set, this app proxies its own API routes to the external backend. The frontend itself still talks only to these local routes:

- `GET /api/engine/sessions`
- `GET /api/engine/sessions/:id`
- `GET /api/engine/memory/:id`
- `GET /api/engine/lifecycle/:id`
- `GET /api/engine/tools`
- `POST /api/engine/chat`

If `STELLO_ENGINE_URL` is not set, the app falls back to the local mock runtime in [src/lib/stello-runtime.ts](/Users/bytedance/Github/stello-board/src/lib/stello-runtime.ts).

More detailed contract notes are in [INTEGRATION.md](/Users/bytedance/Github/stello-board/INTEGRATION.md).

## Expected backend contract

### `GET /api/engine/sessions`

```json
{
  "sessions": [],
  "currentSessionId": "session-id"
}
```

### `GET /api/engine/memory/:id`

```json
{
  "core": {},
  "summary": "markdown",
  "records": [],
  "scope": "markdown",
  "index": "markdown"
}
```

### `GET /api/engine/lifecycle/:id`

```json
{
  "history": []
}
```

### `GET /api/engine/tools`

```json
{
  "calls": []
}
```

### `POST /api/engine/chat`

Request:

```json
{
  "sessionId": "session-id",
  "message": "hello"
}
```

Response:

```json
{
  "sessionId": "session-id",
  "currentSessionId": "session-id",
  "userMessage": {},
  "assistantMessage": {},
  "toolCalls": [],
  "lifecycleTurn": {}
}
```

## Useful pages

- `/graph`: session topology
- `/chat`: send a turn and inspect inline tool calls
- `/memory`: inspect `core.json`, `memory.md`, `records.jsonl`
- `/lifecycle`: inspect turn steps and step payloads
- `/tools`: inspect aggregated tool history

## Verification

Validated locally with:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm exec next build --webpack
```
