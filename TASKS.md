# Stello Board — Implementation Task List

> WebUI for visualizing the Stello Agent SDK runtime process.
> Design prototypes: `pencil-new.pen` (6 screens)
> Tech stack: Next.js 14+ (App Router), Zustand, WebSocket, React Flow, Vercel AI SDK, Shiki, Tailwind CSS v4, Framer Motion

---

## Phase 0: Project Setup

### 0.1 Initialize Next.js Project
- Create Next.js 14+ app with App Router, TypeScript, ESLint
- Configure `tsconfig.json` path aliases (`@/` → `src/`)
- Add `.env.local` for Stello engine connection config

### 0.2 Install Dependencies
```
# Core
next react react-dom

# State & Data
zustand immer

# Graph Visualization
@xyflow/react

# AI / Chat
ai @ai-sdk/openai (or anthropic provider)

# Code Highlighting
shiki

# Styling & Animation
tailwindcss @tailwindcss/typography framer-motion

# WebSocket
socket.io-client socket.io

# Utilities
clsx date-fns lucide-react
```

### 0.3 Tailwind Theme — Terminal Minimal Dashboard
```
colors:
  bg:        #0C0C0C
  surface:   #1A1A1A
  border:    #2A2A2A
  muted:     #525252
  text:      #E5E5E5
  green:     #22C55E  (accent / root / L1 / active)
  blue:      #3B82F6  (children / L2)
  purple:    #8B5CF6  (grandchildren / L3)
  amber:     #F59E0B  (cross-refs / warnings / new sessions)
  red:       #EF4444  (errors / failures)

font-family: "JetBrains Mono", monospace
naming convention: snake_case in UI labels
```

### 0.4 Project Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout with sidebar nav
│   ├── page.tsx                # Redirect to /graph
│   ├── graph/page.tsx          # Screen 1: Session Graph View
│   ├── lifecycle/page.tsx      # Screen 2: Lifecycle Timeline
│   ├── chat/page.tsx           # Screen 3: Agent Chat View
│   ├── memory/page.tsx         # Screen 4: Memory Inspector
│   ├── tools/page.tsx          # Screen 5: Tool Calls Log
│   └── api/
│       ├── engine/route.ts     # Stello engine REST endpoints
│       └── ws/route.ts         # WebSocket upgrade handler
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Left nav bar (all screens)
│   │   └── PageShell.tsx       # Common page wrapper
│   ├── graph/
│   │   ├── SessionGraph.tsx    # React Flow main graph
│   │   ├── SessionNode.tsx     # Custom node component
│   │   ├── CrossRefEdge.tsx    # Dashed amber edge
│   │   └── MiniGraph.tsx       # Small topology preview (Screen 3)
│   ├── lifecycle/
│   │   ├── Timeline.tsx        # Horizontal step timeline
│   │   ├── TimelineStep.tsx    # Individual step block
│   │   └── StepDetail.tsx      # Right panel detail view
│   ├── chat/
│   │   ├── ChatMessages.tsx    # Message list
│   │   ├── ChatBubble.tsx      # User/Assistant message
│   │   ├── ToolCallCard.tsx    # Inline tool call display
│   │   ├── SystemDivider.tsx   # Session event divider
│   │   ├── ChatInput.tsx       # Bottom input bar
│   │   └── ActivityFeed.tsx    # Right panel live feed
│   ├── memory/
│   │   ├── CoreJsonViewer.tsx  # L1 with Shiki highlighting
│   │   ├── SummaryViewer.tsx   # L2 markdown renderer
│   │   ├── RecordsViewer.tsx   # L3 record cards
│   │   └── SessionSelector.tsx # Dropdown for session pick
│   ├── tools/
│   │   ├── StatCards.tsx       # 4 summary cards
│   │   ├── FilterTabs.tsx      # Category filter tabs
│   │   └── ToolTable.tsx       # Data table with rows
│   ├── dialogs/
│   │   └── SplitConfirmDialog.tsx  # Screen 6 modal
│   └── shared/
│       ├── Badge.tsx
│       ├── CodeBlock.tsx       # Shiki-powered code display
│       └── DiffViewer.tsx      # Before/after diff
├── stores/
│   ├── session-store.ts        # Session tree state
│   ├── lifecycle-store.ts      # Lifecycle events state
│   ├── chat-store.ts           # Chat messages state
│   ├── memory-store.ts         # Memory layers state
│   ├── tool-store.ts           # Tool calls state
│   └── ws-store.ts             # WebSocket connection
├── hooks/
│   ├── useStelloEngine.ts      # Engine connection hook
│   ├── useWebSocket.ts         # WS subscription hook
│   └── useSessionGraph.ts      # Graph layout hook
├── lib/
│   ├── stello-client.ts        # Stello SDK client wrapper
│   ├── ws-events.ts            # WebSocket event types
│   ├── graph-layout.ts         # Constellation layout port
│   └── constants.ts            # Colors, config
└── types/
    ├── session.ts              # Session, SessionMeta
    ├── memory.ts               # CoreMemory, Record
    ├── lifecycle.ts            # Hook, Step events
    └── tool.ts                 # ToolCall, ToolResult
```

---

## Phase 1: Layout & Navigation

### 1.1 Root Layout + Sidebar Navigation
- **Design ref**: Left sidebar in Screen 1 (`8H5mm`)
- Dark sidebar with icon nav: graph, lifecycle, chat, memory, tools
- Active indicator: green left border + highlighted icon
- Logo/brand at top, collapse toggle
- Use `lucide-react` icons

### 1.2 Page Shell Component
- Common wrapper: header with page title (snake_case), breadcrumb
- Responsive layout with resizable panels where needed

---

## Phase 2: Session Graph View (Screen 1)

### 2.1 React Flow Graph Setup
- **Design ref**: Screen 1 (`8H5mm`)
- Initialize `@xyflow/react` with dark theme
- Port constellation layout algorithm from `packages/visualizer/src/layout/constellation.ts`
- Ring-based layout: root center, children inner ring, grandchildren outer ring

### 2.2 Custom Session Node
- Circular node with session label
- Color by depth: green (root), blue (children), purple (grandchildren), gray (archived)
- Glow effect on active session
- Tooltip on hover: session ID, turn count, created time

### 2.3 Edge Types
- Solid edges: parent→child relationships
- Dashed amber edges: cross-branch references (`stello_add_ref`)
- Animated edge for active data flow

### 2.4 Right Detail Panel
- Session detail card: id, status, parent, depth, turns, timestamps
- Memory layers summary: L1 field count, L2 word count, L3 record count
- Live event feed: recent lifecycle events for selected session

### 2.5 Interactions
- Click node → select session → populate right panel
- Double-click node → navigate to Memory Inspector for that session
- Zoom/pan controls
- Search/filter sessions

---

## Phase 3: Lifecycle Timeline (Screen 2)

### 3.1 Timeline Component
- **Design ref**: Screen 2 (`GOjF5`)
- Horizontal scrollable timeline
- Steps: `bootstrap` → `ingest` → `assemble` → `llm_call` → `afterTurn` → `flushBubbles`
- `afterTurn` expands into sub-steps: L3 append, L2 compact, L1 update

### 3.2 Step Rendering
- Each step: icon, label, duration badge, status indicator (completed/running/pending)
- Connecting lines between steps with animated progress
- Color-coded: green (complete), amber (running), gray (pending), red (error)

### 3.3 Step Detail Panel
- **Input tab**: Show input data for the step (assembled context, user message, etc.)
- **Output tab**: Show output/result
- **Diff tab**: Before/after state changes (especially for memory mutations)
- **Bubble tab**: For `flushBubbles` step — show propagation path, fields, targets

### 3.4 Session Selector
- Dropdown to pick which session's lifecycle to inspect
- Show current turn number, allow stepping through turns

---

## Phase 4: Agent Chat View (Screen 3)

### 4.1 Chat Message List
- **Design ref**: Screen 3 (`Kj1cz`)
- User messages: right-aligned, dark surface bg
- Assistant messages: left-aligned with green avatar indicator
- Auto-scroll to bottom, with "scroll to latest" button

### 4.2 Inline Tool Call Cards
- Expandable cards within assistant messages
- Show: tool name, arguments (syntax highlighted), result, duration
- Status badge: success (green) / error (red)
- Match Stello's 8 agent tools: `stello_read_core`, `stello_update_core`, etc.

### 4.3 System Event Dividers
- Horizontal divider with event label when session events occur
- Events: "new_session_created: {label}", "session_switched", "split_proposed"
- Amber color for session creation events

### 4.4 Chat Input
- Bottom-fixed input bar with green `>` prompt prefix
- Send button, session indicator showing current active session
- Support keyboard shortcut (Enter to send)

### 4.5 Right Panel — Live Context
- **Mini topology graph**: Small React Flow instance showing current session tree
  - Highlight newly created nodes with amber pulse animation
  - Auto-update when `stello_create_session` fires
- **Activity feed**: Real-time list of lifecycle events, tool calls, session changes
- **Assembled context card**: Show what context was assembled for the current turn

### 4.6 Vercel AI SDK Integration
- Use `ai` SDK's `useChat` hook for streaming responses
- Connect to Stello engine's LLM call through API route
- Handle tool call results inline

---

## Phase 5: Memory Inspector (Screen 4)

### 5.1 Three-Column Layout
- **Design ref**: Screen 4 (`tVhGj`)
- L1 (core.json) | L2 (memory.md) | L3 (records.jsonl)
- Resizable columns with drag handles

### 5.2 L1 Core JSON Viewer
- Shiki syntax-highlighted JSON display
- Show field count, last updated timestamp
- Editable mode for debugging (optional)
- Highlight changed fields after `stello_update_core`

### 5.3 L2 Summary Viewer
- Render `memory.md` as styled markdown
- Show session ID, word count, last compacted time
- Inheritance policy badge

### 5.4 L3 Records Viewer
- Card-based display for each JSONL record
- Show: role, content preview, timestamp, turn number
- Scroll through records chronologically

### 5.5 Session Selector
- Dropdown at top to switch between sessions
- Show session tree path (root > child > grandchild)
- Quick-switch between parent/children

---

## Phase 6: Tool Calls Log (Screen 5)

### 6.1 Summary Stat Cards
- **Design ref**: Screen 5 (`eeEVL`)
- 4 cards: total_calls, succeeded, failed, avg_duration
- Animated count-up on load

### 6.2 Filter Tabs
- Tabs: all | read | write | session | failed
- Map to tool categories:
  - read: `stello_read_core`, `stello_read_summary`, `stello_list_sessions`
  - write: `stello_update_core`, `stello_add_ref`, `stello_update_meta`
  - session: `stello_create_session`, `stello_archive`

### 6.3 Data Table
- Columns: timestamp, tool_name, session, args (truncated), duration, status
- Failed rows highlighted with red-500/10 background
- Expandable row → full args & result JSON
- Sort by any column, search/filter

---

## Phase 7: Split Confirm Dialog (Screen 6)

### 7.1 Modal Component
- **Design ref**: Screen 6 (`yKlvn`)
- Overlay on dimmed background (graph visible behind)
- Framer Motion enter/exit animation

### 7.2 Reason Card
- Display split proposal reason (e.g., "topic drift detected")
- Show drift score, context from `SplitGuard` analysis

### 7.3 Editable Fields
- `parent_session`: Pre-filled, editable dropdown
- `suggested_label`: Text input for new session name
- `suggested_scope`: Scope/focus description

### 7.4 Inheritance Policy Selector
- Radio group: full / summary (default) / minimal / scoped
- Brief description for each option

### 7.5 Action Buttons
- "dismiss" (gray) — reject split proposal
- "confirm_split" (green) — approve and create session
- Wire to `ConfirmProtocol` from Stello SDK

---

## Phase 8: Backend Integration

### 8.1 Stello Engine Client
- Create `lib/stello-client.ts` wrapping `@stello-ai/core`
- Initialize engine with filesystem adapter
- Expose methods: getSessions, getMemory, runTurn, etc.

### 8.2 API Routes
```
POST /api/engine/chat          → Run a conversation turn
GET  /api/engine/sessions      → List all sessions
GET  /api/engine/sessions/[id] → Session detail + memory
GET  /api/engine/memory/[id]   → L1/L2/L3 for a session
GET  /api/engine/tools         → Tool call history
POST /api/engine/confirm       → Approve/reject proposals
```

### 8.3 WebSocket Event System
- Server-side: Hook into Stello's event emitters
  - `CoreMemory` → `change`, `updateProposal`
  - `LifecycleManager` → hook start/end events, `splitProposal`
  - `SessionTree` → session created/archived/switched
  - `AgentTools` → tool call start/end
- Client-side: `useWebSocket` hook subscribing to events
- Event types:
```typescript
type WSEvent =
  | { type: 'session:created'; data: Session }
  | { type: 'session:switched'; data: { from: string; to: string } }
  | { type: 'lifecycle:step'; data: { hook: string; phase: 'start' | 'end'; duration?: number } }
  | { type: 'memory:l1:changed'; data: { fields: string[] } }
  | { type: 'memory:l2:compacted'; data: { sessionId: string } }
  | { type: 'memory:l3:appended'; data: { sessionId: string; record: Record } }
  | { type: 'tool:called'; data: ToolCall }
  | { type: 'tool:result'; data: ToolResult }
  | { type: 'proposal:split'; data: SplitProposal }
  | { type: 'proposal:update'; data: UpdateProposal }
  | { type: 'bubble:flushed'; data: { fields: string[]; targets: string[] } }
```

### 8.4 Zustand Stores
- `session-store`: Session tree, selected session, session metadata
- `lifecycle-store`: Current lifecycle steps, history per session/turn
- `chat-store`: Messages per session, streaming state
- `memory-store`: L1/L2/L3 content per session, diff tracking
- `tool-store`: Tool call history, stats aggregation
- `ws-store`: Connection status, event buffer, reconnect logic

---

## Phase 9: Real-Time Sync

### 9.1 Graph Auto-Update
- When `session:created` event fires → add node to React Flow
- Animate new node entry (scale + amber glow)
- Auto-layout recalculation with smooth transition

### 9.2 Chat ↔ Graph Sync
- Tool calls like `stello_create_session` in chat → trigger graph update
- System divider appears in chat + mini-graph highlights new node
- Session switch events update chat context indicator

### 9.3 Memory Live Update
- `memory:l1:changed` → re-fetch and highlight changed fields in L1 viewer
- `memory:l2:compacted` → refresh L2 markdown
- `memory:l3:appended` → append new record card with animation

### 9.4 Lifecycle Live Progress
- During a turn: timeline steps animate from pending → running → complete
- Duration badges update in real-time

---

## Phase 10: Polish & UX

### 10.1 Animations
- Framer Motion page transitions
- Node pulse animations on state change
- Smooth panel resize transitions
- Loading skeletons for async data

### 10.2 Keyboard Shortcuts
- `1-5`: Navigate between screens
- `Cmd+K`: Command palette (search sessions, jump to tool call, etc.)
- `Esc`: Close dialogs/panels

### 10.3 Responsive Considerations
- Collapsible sidebar on smaller screens
- Panel layouts stack vertically on narrow viewports
- Graph zoom controls accessible on touch

### 10.4 Error States
- WebSocket disconnection indicator + auto-reconnect
- Empty states for no sessions, no tool calls, etc.
- Error boundaries per panel (don't crash the whole page)

---

## Implementation Order (Recommended)

| Priority | Phase | Reason |
|----------|-------|--------|
| 1 | Phase 0 | Foundation — nothing works without setup |
| 2 | Phase 1 | Layout shell needed by all screens |
| 3 | Phase 8.1–8.2 | Backend needed before any screen can show real data |
| 4 | Phase 2 | Session Graph is the core visualization |
| 5 | Phase 4 | Chat view is the primary interaction point |
| 6 | Phase 8.3–8.4 | WebSocket + stores enable real-time |
| 7 | Phase 9 | Real-time sync ties graph + chat together |
| 8 | Phase 5 | Memory Inspector for debugging |
| 9 | Phase 3 | Lifecycle Timeline for deep inspection |
| 10 | Phase 6 | Tool Calls Log for monitoring |
| 11 | Phase 7 | Split Dialog triggered from proposals |
| 12 | Phase 10 | Polish after core features work |

---

## Color Reference

| Color | Hex | Usage |
|-------|-----|-------|
| Green | `#22C55E` | Root session, L1 memory, active states, accent |
| Blue | `#3B82F6` | Child sessions, L2 memory |
| Purple | `#8B5CF6` | Grandchild sessions, L3 memory |
| Amber | `#F59E0B` | Cross-refs, warnings, new sessions, proposals |
| Red | `#EF4444` | Errors, failures, archived |
| Gray | `#A3A3A3` | Muted text, archived sessions |
| Surface | `#1A1A1A` | Cards, panels |
| Border | `#2A2A2A` | Dividers, borders |
| Background | `#0C0C0C` | Page background |

---

## Design Files

All 6 screen prototypes are in `pencil-new.pen`:

1. **session_graph_view** (`8H5mm`) — Constellation graph + session detail
2. **lifecycle_timeline** (`GOjF5`) — Horizontal hook timeline + step detail
3. **agent_chat_view** (`Kj1cz`) — Chat + inline tools + live mini-graph
4. **memory_inspector** (`tVhGj`) — L1/L2/L3 three-column layout
5. **tool_calls_log** (`eeEVL`) — Stats + filterable table
6. **split_confirm_dialog** (`yKlvn`) — Modal with editable fields + policy selector
