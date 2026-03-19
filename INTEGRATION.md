# External Engine Integration

This project now supports two modes:

- external engine mode: proxies all board requests to a running Stello backend
- local fallback mode: uses the built-in mock runtime in `src/lib/stello-runtime.ts`

## Configure external mode

Create `.env.local` in the project root:

```bash
STELLO_ENGINE_URL=http://127.0.0.1:3001
STELLO_ENGINE_PREFIX=/api/engine
```

`STELLO_ENGINE_URL`
- base origin of your Stello backend
- example: `http://127.0.0.1:3001`

`STELLO_ENGINE_PREFIX`
- path prefix added by this board when proxying
- default: `/api/engine`

The board keeps its own frontend-facing endpoints unchanged:

- `GET /api/engine/sessions`
- `GET /api/engine/sessions/:id`
- `GET /api/engine/memory/:id`
- `GET /api/engine/lifecycle/:id`
- `GET /api/engine/tools`
- `POST /api/engine/chat`

When `STELLO_ENGINE_URL` is set, those routes proxy to:

- `${STELLO_ENGINE_URL}${STELLO_ENGINE_PREFIX}/sessions`
- `${STELLO_ENGINE_URL}${STELLO_ENGINE_PREFIX}/sessions/:id`
- `${STELLO_ENGINE_URL}${STELLO_ENGINE_PREFIX}/memory/:id`
- `${STELLO_ENGINE_URL}${STELLO_ENGINE_PREFIX}/lifecycle/:id`
- `${STELLO_ENGINE_URL}${STELLO_ENGINE_PREFIX}/tools`
- `${STELLO_ENGINE_URL}${STELLO_ENGINE_PREFIX}/chat`

## Expected backend response shapes

### `GET /sessions`

```json
{
  "sessions": [],
  "currentSessionId": "session-id"
}
```

### `GET /sessions/:id`

```json
{
  "session": {},
  "summary": "markdown",
  "recordCount": 2,
  "recentToolCalls": []
}
```

### `GET /memory/:id`

```json
{
  "core": {},
  "summary": "markdown",
  "records": [],
  "scope": "markdown",
  "index": "markdown"
}
```

### `GET /lifecycle/:id`

```json
{
  "history": []
}
```

### `GET /tools`

```json
{
  "calls": []
}
```

### `POST /chat`

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

## Current limitation

This change only handles HTTP proxying. WebSocket/event-stream sync is not wired yet.
