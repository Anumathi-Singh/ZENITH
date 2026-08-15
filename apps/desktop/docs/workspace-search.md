# Workspace search and indexing

Zenith builds a metadata-only index when the Electron backend opens a workspace. The index stores paths, filenames, extensions, and directories; it does not preload file contents. One debounced recursive filesystem watcher refreshes that index after external create, delete, and rename events. Generated directories such as `.git`, `node_modules`, `dist`, `build`, `coverage`, `.cache`, `out`, `vendor`, and `.next` are excluded.

Quick Open performs ranked filename matching against that backend index. Content search reads only indexed workspace files, skips known binary extensions and files larger than 2 MiB, and returns normalized matches rather than raw tool output. Search IDs provide cancellation and the renderer ignores stale responses.

The current implementation uses a bounded-concurrency Node filesystem fallback instead of ripgrep. This keeps packaged Windows builds deterministic because the project does not yet bundle an `rg` executable. The service boundary can adopt a bundled ripgrep runner later without changing SearchPanel, preload, or IPC DTOs.
