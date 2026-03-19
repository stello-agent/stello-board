# TODO

## High priority

- replace pull-based refresh with WebSocket or SSE event sync for sessions, lifecycle, memory, and tools
- define and implement the external Stello backend contract for `/api/engine/*`
- remove fallback mock runtime from production deployments once the real backend is stable
- add proper loading, empty, and error states for all data panels when the external engine is unavailable

## Product work

- implement split confirm dialog and wire it to confirm/dismiss endpoints
- add session search and filtering in the graph view
- add richer lifecycle detail tabs: diff view, bubble targets, before/after memory state
- add assembled-context panel to chat right sidebar
- add session path and parent/child quick navigation in memory inspector

## Backend integration

- support authentication headers or tokens when proxying to the external engine
- support configurable request timeout and retry policy in the proxy layer
- add backend health check endpoint and show engine status in sidebar
- standardize external engine error payloads so the frontend can render them cleanly

## Realtime

- add `/api/engine/ws` or SSE proxy support
- update Zustand stores from pushed events instead of full-page fetches
- animate graph node creation, lifecycle progress, and memory append events from live signals

## UX polish

- add command palette and keyboard shortcuts
- improve mobile and narrow-screen layouts
- add resizable panes for memory and detail-heavy screens
- refine graph interactions: double-click navigation, focus mode, search jump

## Engineering

- add tests for API proxy routes
- add tests for runtime fallback behavior
- document sample external engine implementation
- move current integration notes into a dedicated backend spec if the contract grows
