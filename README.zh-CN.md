# stello-board

面向 Stello Agent SDK 的开发者可视化前端。

它提供了 session 图谱、聊天面板、memory 检查器、lifecycle 时间线和 tool 日志，适合拿来观察一个正在运行的 Stello engine。当前前端固定通过 `/api/engine/*` 这组接口取数，后端可以是：

- 外部独立运行的 Stello backend
- 本项目内置的本地 mock runtime

## 当前状态

已实现：

- session graph 页面
- chat 页面，可提交 turn
- memory inspector
- lifecycle timeline
- tool calls log
- `/api/engine/*` 代理层
- 基于 `@stello-ai/core` 的本地 fallback runtime

暂未实现：

- WebSocket / SSE 实时同步
- split confirm dialog
- command palette 和快捷键
- 生产环境鉴权和多用户隔离

## 启动方式

安装依赖：

```bash
pnpm install
```

启动开发环境：

```bash
pnpm dev
```

打开：

```text
http://localhost:3000
```

## 外部 engine 接入

在项目根目录创建 `.env.local`：

```bash
STELLO_ENGINE_URL=http://127.0.0.1:3001
STELLO_ENGINE_PREFIX=/api/engine
```

字段含义：

- `STELLO_ENGINE_URL`：外部 Stello backend 的 origin
- `STELLO_ENGINE_PREFIX`：外部 backend 上对应的接口前缀，默认 `/api/engine`

当 `STELLO_ENGINE_URL` 被设置后，本项目自己的 `/api/engine/*` 会自动转发到外部 backend。前端页面本身不用改，仍然只访问本地这组接口：

- `GET /api/engine/sessions`
- `GET /api/engine/sessions/:id`
- `GET /api/engine/memory/:id`
- `GET /api/engine/lifecycle/:id`
- `GET /api/engine/tools`
- `POST /api/engine/chat`

如果没有配置 `STELLO_ENGINE_URL`，项目会退回到本地 mock runtime，代码在 [src/lib/stello-runtime.ts](/Users/bytedance/Github/stello-board/src/lib/stello-runtime.ts)。

更完整的接口说明在 [INTEGRATION.md](/Users/bytedance/Github/stello-board/INTEGRATION.md)。

## 外部 backend 期望的接口结构

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

请求：

```json
{
  "sessionId": "session-id",
  "message": "hello"
}
```

响应：

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

## 页面说明

- `/graph`：查看 session 拓扑图
- `/chat`：发送一轮对话，并查看 inline tool call
- `/memory`：查看 `core.json`、`memory.md`、`records.jsonl`
- `/lifecycle`：查看 turn 生命周期步骤和步骤输入输出
- `/tools`：查看所有 tool 调用记录

## 本地验证

当前代码已经通过以下检查：

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm exec next build --webpack
```

## 下一步建议

如果你准备继续推进，优先级建议是：

1. 给外部 Stello backend 真正实现 `/api/engine/*` 这组接口
2. 把当前 HTTP 拉取改成 WebSocket 或 SSE 实时同步
3. 补 split confirm dialog 和 proposal 流程
