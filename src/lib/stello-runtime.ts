import 'server-only';

import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import {
  AgentTools,
  CoreMemory,
  LifecycleManager,
  NodeFileSystemAdapter,
  SessionMemory,
  SessionTreeImpl,
  SplitGuard,
  type CoreSchema,
  type SessionMeta,
  type TurnRecord,
} from '@stello-ai/core';
import type { TurnLifecycle, LifecycleStep } from '@/types/lifecycle';
import type { ToolCallWithResult } from '@/types/tool';

const DATA_DIR = join(process.cwd(), 'stello-data');

const CORE_SCHEMA: CoreSchema = {
  profile_name: { type: 'string', default: '', bubbleable: true },
  product_goal: { type: 'string', default: '', bubbleable: true },
  active_focus: { type: 'string', default: '', bubbleable: true },
  open_threads: { type: 'array', default: [], bubbleable: true },
  tech_stack: { type: 'array', default: ['Next.js', 'React', 'TypeScript'], bubbleable: true },
};

interface RuntimeState {
  initialized: boolean;
  currentSessionId: string | null;
  sessions: SessionTreeImpl;
  core: CoreMemory;
  memory: SessionMemory;
  lifecycle: LifecycleManager;
  guard: SplitGuard;
  tools: AgentTools;
  lifecycleHistory: Map<string, TurnLifecycle[]>;
  toolCalls: ToolCallWithResult[];
}

const runtime: RuntimeState = {
  initialized: false,
  currentSessionId: null,
  sessions: new SessionTreeImpl(new NodeFileSystemAdapter(DATA_DIR)),
  core: new CoreMemory(new NodeFileSystemAdapter(DATA_DIR), CORE_SCHEMA),
  memory: new SessionMemory(new NodeFileSystemAdapter(DATA_DIR)),
  lifecycle: new LifecycleManager(
    new CoreMemory(new NodeFileSystemAdapter(DATA_DIR), CORE_SCHEMA),
    new SessionMemory(new NodeFileSystemAdapter(DATA_DIR)),
    new SessionTreeImpl(new NodeFileSystemAdapter(DATA_DIR)),
    {
      dataDir: DATA_DIR,
      coreSchema: CORE_SCHEMA,
      callLLM: callLLMStub,
    },
  ),
  guard: new SplitGuard(new SessionTreeImpl(new NodeFileSystemAdapter(DATA_DIR)), { testMode: true }),
  tools: new AgentTools(
    new SessionTreeImpl(new NodeFileSystemAdapter(DATA_DIR)),
    new CoreMemory(new NodeFileSystemAdapter(DATA_DIR), CORE_SCHEMA),
    new SessionMemory(new NodeFileSystemAdapter(DATA_DIR)),
    new LifecycleManager(
      new CoreMemory(new NodeFileSystemAdapter(DATA_DIR), CORE_SCHEMA),
      new SessionMemory(new NodeFileSystemAdapter(DATA_DIR)),
      new SessionTreeImpl(new NodeFileSystemAdapter(DATA_DIR)),
      {
        dataDir: DATA_DIR,
        coreSchema: CORE_SCHEMA,
        callLLM: callLLMStub,
      },
    ),
    new SplitGuard(new SessionTreeImpl(new NodeFileSystemAdapter(DATA_DIR)), { testMode: true }),
  ),
  lifecycleHistory: new Map(),
  toolCalls: [],
};

function createRuntimeObjects() {
  const fs = new NodeFileSystemAdapter(DATA_DIR);
  const sessions = new SessionTreeImpl(fs);
  const core = new CoreMemory(fs, CORE_SCHEMA);
  const memory = new SessionMemory(fs);
  const lifecycle = new LifecycleManager(core, memory, sessions, {
    dataDir: DATA_DIR,
    coreSchema: CORE_SCHEMA,
    callLLM: callLLMStub,
  });
  const guard = new SplitGuard(sessions, { testMode: true });
  const tools = new AgentTools(sessions, core, memory, lifecycle, guard);

  runtime.sessions = sessions;
  runtime.core = core;
  runtime.memory = memory;
  runtime.lifecycle = lifecycle;
  runtime.guard = guard;
  runtime.tools = tools;
}

async function callLLMStub(prompt: string): Promise<string> {
  if (prompt.includes('输出更新后的记忆摘要')) {
    const userMatch = prompt.match(/用户：([\s\S]*?)\n助手：/);
    const assistantMatch = prompt.match(/助手：([\s\S]*?)\n\n输出/);
    const userText = userMatch?.[1]?.trim() ?? '';
    const assistantText = assistantMatch?.[1]?.trim() ?? '';
    return [
      '## session_summary',
      '',
      `- latest_user_intent: ${userText || 'n/a'}`,
      `- latest_agent_action: ${assistantText || 'n/a'}`,
      '- state: active',
    ].join('\n');
  }

  if (prompt.includes('如需更新输出 JSON')) {
    const userMatch = prompt.match(/用户：([\s\S]*?)\n助手：/);
    const text = userMatch?.[1] ?? '';
    const updates: Array<{ path: string; value: unknown }> = [];
    const nameMatch = text.match(/(?:my name is|我是|叫)\s*([A-Za-z\u4e00-\u9fa5_-]+)/i);
    const goalMatch = text.match(/(?:goal|目标|想做|要做)[：:\s]+(.+)/i);
    const focusMatch = text.match(/(?:focus|当前关注|继续做)[：:\s]+(.+)/i);

    if (nameMatch) updates.push({ path: 'profile_name', value: nameMatch[1] });
    if (goalMatch) updates.push({ path: 'product_goal', value: goalMatch[1].trim() });
    if (focusMatch) updates.push({ path: 'active_focus', value: focusMatch[1].trim() });

    return JSON.stringify({ updates });
  }

  if (prompt.includes('生成对话边界说明')) {
    const childMatch = prompt.match(/子对话标题：(.+?)\n/);
    const child = childMatch?.[1]?.trim() ?? 'new thread';
    return `# scope\n\nFocus on ${child}.\n\n- stay within this topic\n- capture implementation decisions`;
  }

  if (prompt.includes('整理以下对话记忆为最终摘要')) {
    return '## final_memory\n\n- session switched\n- summary compacted';
  }

  return 'ok';
}

async function seedRuntime() {
  const sessions = await runtime.sessions.listAll();
  if (sessions.length > 0) {
    runtime.currentSessionId = sessions.find((session) => session.status === 'active')?.id ?? sessions[0]?.id ?? null;
    return;
  }

  const root = await runtime.sessions.createRoot('main_thread');
  const ui = await runtime.lifecycle.prepareChildSpawn({
    parentId: root.id,
    label: 'ui_surface',
    scope: 'frontend',
  });
  const sdk = await runtime.lifecycle.prepareChildSpawn({
    parentId: root.id,
    label: 'sdk_bridge',
    scope: 'integration',
  });

  await runtime.sessions.addRef(ui.id, sdk.id);
  await runtime.sessions.updateMeta(root.id, { turnCount: 4 });
  await runtime.sessions.updateMeta(ui.id, { turnCount: 2 });
  await runtime.sessions.updateMeta(sdk.id, { turnCount: 3 });

  await runtime.core.writeCore('product_goal', 'Build a visual debugger for the Stello Agent SDK');
  await runtime.core.writeCore('active_focus', 'Connect frontend screens to live runtime data');

  await runtime.memory.writeMemory(root.id, '## main_thread\n\n- overall product direction\n- session graph is the main navigator');
  await runtime.memory.writeMemory(ui.id, '## ui_surface\n\n- graph, memory, lifecycle, tools pages\n- terminal-style dashboard');
  await runtime.memory.writeMemory(sdk.id, '## sdk_bridge\n\n- wrap @stello-ai/core on the server\n- expose chat, sessions, memory, tools');

  await runtime.memory.appendRecord(root.id, {
    role: 'user',
    content: 'We need a Stello runtime inspector.',
    timestamp: new Date().toISOString(),
  });
  await runtime.memory.appendRecord(root.id, {
    role: 'assistant',
    content: 'I will expose graph, chat, memory and tool views.',
    timestamp: new Date().toISOString(),
  });

  runtime.currentSessionId = root.id;
}

function pushLifecycleTurn(sessionId: string, turn: TurnLifecycle) {
  const history = runtime.lifecycleHistory.get(sessionId) ?? [];
  history.push(turn);
  runtime.lifecycleHistory.set(sessionId, history);
}

async function executeTrackedTool(
  sessionId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolCallWithResult> {
  const startedAt = Date.now();
  const callId = randomUUID();
  const timestamp = new Date(startedAt).toISOString();
  const result = await runtime.tools.executeTool(name, args);
  const finishedAt = Date.now();

  const toolCall: ToolCallWithResult = {
    id: callId,
    name,
    sessionId,
    args,
    timestamp,
    result: {
      id: randomUUID(),
      toolCallId: callId,
      success: result.success,
      data: result.data,
      error: result.error,
      duration: finishedAt - startedAt,
      timestamp: new Date(finishedAt).toISOString(),
    },
  };

  runtime.toolCalls.unshift(toolCall);
  runtime.toolCalls = runtime.toolCalls.slice(0, 200);
  return toolCall;
}

function buildAssistantReply(
  session: SessionMeta,
  message: string,
  toolCalls: ToolCallWithResult[],
): string {
  const toolLine = toolCalls.length > 0
    ? `\n\ntool_calls: ${toolCalls.map((call) => call.name).join(', ')}`
    : '';

  if (/split|拆分|branch|子会话/i.test(message)) {
    const created = toolCalls.find((call) => call.name === 'stello_create_session');
    if (created?.result?.success) {
      const child = created.result.data as SessionMeta;
      return `created child session \`${child.label}\` and kept the parent thread focused.${toolLine}`;
    }
  }

  if (/goal|目标|记住|remember/i.test(message)) {
    return `updated core memory for session \`${session.label}\` and persisted the latest product intent.${toolLine}`;
  }

  return `processed message for \`${session.label}\` and synced session memory, lifecycle, and tool history.${toolLine}`;
}

function createLifecycleStep(
  hook: string,
  status: LifecycleStep['status'],
  timestamp: string,
  duration: number,
  inputData?: unknown,
  outputData?: unknown,
): LifecycleStep {
  return {
    hook,
    phase: status === 'running' ? 'start' : 'end',
    status,
    timestamp,
    duration,
    inputData,
    outputData,
  };
}

export async function ensureRuntime() {
  if (runtime.initialized) return runtime;

  createRuntimeObjects();
  await runtime.core.init();
  await seedRuntime();
  runtime.initialized = true;

  return runtime;
}

export async function listSessions() {
  await ensureRuntime();
  const sessions = await runtime.sessions.listAll();
  return {
    sessions: sessions.sort((a, b) => a.depth - b.depth || a.index - b.index),
    currentSessionId: runtime.currentSessionId,
  };
}

export async function getSessionDetail(sessionId: string) {
  await ensureRuntime();
  const session = await runtime.sessions.get(sessionId);
  if (!session) return null;

  const summary = await runtime.memory.readMemory(sessionId);
  const records = await runtime.memory.readRecords(sessionId);

  return {
    session,
    summary,
    recordCount: records.length,
    recentToolCalls: runtime.toolCalls.filter((call) => call.sessionId === sessionId).slice(0, 10),
  };
}

export async function getSessionMemory(sessionId: string) {
  await ensureRuntime();
  const core = await runtime.core.readCore();
  const summary = await runtime.memory.readMemory(sessionId);
  const records = await runtime.memory.readRecords(sessionId);
  const scope = await runtime.memory.readScope(sessionId);
  const index = await runtime.memory.readIndex(sessionId);

  return {
    core,
    summary,
    records,
    scope,
    index,
  };
}

export async function getLifecycleHistory(sessionId: string) {
  await ensureRuntime();
  return runtime.lifecycleHistory.get(sessionId) ?? [];
}

export async function getToolHistory() {
  await ensureRuntime();
  return runtime.toolCalls;
}

export async function runTurn(sessionId: string, message: string) {
  await ensureRuntime();
  const session = await runtime.sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  runtime.currentSessionId = sessionId;

  const userMessage: TurnRecord = {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  };

  const toolCalls: ToolCallWithResult[] = [];

  const goalMatch = message.match(/(?:goal|目标|记住|remember)[：:\s]+(.+)/i);
  if (goalMatch) {
    toolCalls.push(
      await executeTrackedTool(sessionId, 'stello_update_core', {
        path: 'product_goal',
        value: goalMatch[1].trim(),
      }),
    );
  }

  const focusMatch = message.match(/(?:focus|当前关注|继续做)[：:\s]+(.+)/i);
  if (focusMatch) {
    toolCalls.push(
      await executeTrackedTool(sessionId, 'stello_update_core', {
        path: 'active_focus',
        value: focusMatch[1].trim(),
      }),
    );
  }

  let createdChild: SessionMeta | null = null;
  if (/split|拆分|branch|子会话/i.test(message)) {
    const label = message.match(/["“](.+?)["”]/)?.[1] ?? `thread_${Date.now().toString().slice(-4)}`;
    const createCall = await executeTrackedTool(sessionId, 'stello_create_session', {
      parentId: sessionId,
      label,
      scope: 'follow_up',
    });
    toolCalls.push(createCall);
    if (createCall.result?.success && createCall.result.data) {
      createdChild = createCall.result.data as SessionMeta;
    }
  }

  const assistantContent = buildAssistantReply(session, message, toolCalls);
  const assistantMessage: TurnRecord = {
    role: 'assistant',
    content: assistantContent,
    timestamp: new Date().toISOString(),
    metadata: toolCalls.length > 0 ? { toolCalls } : undefined,
  };

  const bootstrapStartedAt = new Date().toISOString();
  const bootstrapped = await runtime.lifecycle.bootstrap(sessionId);
  const afterTurnStarted = Date.now();
  const afterTurnResult = await runtime.lifecycle.afterTurn(sessionId, userMessage, assistantMessage);
  await runtime.lifecycle.flushBubbles();

  const lifecycleTurn: TurnLifecycle = {
    sessionId,
    turnNumber: session.turnCount + 1,
    startedAt: bootstrapStartedAt,
    completedAt: new Date().toISOString(),
    steps: [
      createLifecycleStep('bootstrap', 'completed', bootstrapStartedAt, 24, { sessionId }, bootstrapped.context),
      createLifecycleStep('ingest', 'completed', new Date().toISOString(), 10, { message }, { matchedSkill: null }),
      createLifecycleStep('assemble', 'completed', new Date().toISOString(), 12, { sessionId }, bootstrapped.context),
      createLifecycleStep('llm_call', 'completed', new Date().toISOString(), 18, { message }, { reply: assistantContent }),
      createLifecycleStep('afterTurn', 'completed', new Date().toISOString(), Date.now() - afterTurnStarted, { userMessage, assistantMessage }, afterTurnResult),
      createLifecycleStep('flushBubbles', 'completed', new Date().toISOString(), 8, undefined, {
        updatedCore: await runtime.core.readCore(),
      }),
    ],
  };

  pushLifecycleTurn(sessionId, lifecycleTurn);

  return {
    sessionId,
    currentSessionId: runtime.currentSessionId,
    userMessage,
    assistantMessage: {
      ...assistantMessage,
      id: randomUUID(),
      sessionId,
      toolCalls: toolCalls.map((call) => ({
        id: call.id,
        name: call.name,
        args: call.args,
        result: call.result?.data,
        error: call.result?.error,
        duration: call.result?.duration,
        status: call.result?.success ? 'success' : 'error',
      })),
    },
    toolCalls,
    lifecycleTurn,
    createdChild,
  };
}
