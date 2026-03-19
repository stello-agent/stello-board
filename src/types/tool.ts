/** Tool call record */
export interface ToolCall {
  id: string;
  name: string;
  sessionId: string;
  args: Record<string, unknown>;
  timestamp: string;
}

/** Tool execution result */
export interface ToolResult {
  id: string;
  toolCallId: string;
  success: boolean;
  data?: unknown;
  error?: string;
  duration: number;
  timestamp: string;
}

/** Combined tool call with result */
export interface ToolCallWithResult extends ToolCall {
  result?: ToolResult;
}
