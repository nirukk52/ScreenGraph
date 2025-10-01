# ScreenGraph

A full-Kotlin, multi-module project template inspired by KotlinConf App. Modules:

- :backend — Ktor server (Koin, JSON, SQLite for dev)
- :agent — Agent orchestrations (Koin). TODO: add Koog + MCP tools when coordinates are confirmed.
- :shared — Common models/utilities shared by all modules
- :ui — Compose Multiplatform (WASM) web UI

## Quick start

- Backend: `./gradlew :backend:run` (exposes http://localhost:8080/health)
- UI (wasm/js dev server): `./gradlew :ui:wasmJsRun`

Note: Koog/MCP dependencies are placeholders pending exact Maven coordinates. Please provide the artifact coordinates to finalize.
