# FR-012: plane-microservice-hosting

**Status:** 📋 Todo | 🚧 In Progress | ✅ Done | 🔥 Blocked  
**Priority:** P1 (High)  
**Milestone:** [M6 - Integrations]  
**Owner:** [TBD]  
**Estimated Effort:** Large

---

## 📝 Description
Create a dedicated microservice to host a self-contained Plane instance alongside ScreenGraph. The service will encapsulate Plane deployment concerns (container orchestration, env, storage) and expose a stable internal URL for our team. This enables first-class work tracking (issues, epics, pages) without leaving our environment, while preserving our existing `/jira` docs as the source of truth for planning/PRDs.

References:
- Plane product docs: [Plane Docs](https://docs.plane.so/)
- Plane OSS repo and self-hosting guides: [makeplane/plane](https://github.com/makeplane/plane?tab=readme-ov-file)

---

## 🎯 Acceptance Criteria
- [ ] A new integration service is documented under `backend/` with a clear ops README (no code coupling to Encore runtime).  
- [ ] Plane can be brought up locally via documented commands (Docker Compose or AIO image) and is reachable at a stable URL (e.g., http://localhost:8080 or worktree-specific port).  
- [ ] Persistent volumes are configured for DB/Redis/RabbitMQ/object storage per Plane’s self-host recommendations.  
- [ ] Health check docs: how to start, stop, view logs, and back up data.  
- [ ] Zero changes to existing backend/frontend code paths (no imports); only infrastructure + documentation.  
- [ ] Security note: admin bootstrap credentials stored/managed securely (local: .env; prod: secrets).  

---

## 🔗 Dependencies
- Docker or container runtime available locally (dev)  
- Optional: S3-compatible storage (MinIO) for artifacts  
- Worktree port isolation policy (ensure Plane ports don’t collide)

---

## 🧪 Testing Requirements
- [ ] Start Plane; create a test workspace/project; verify UI loads and basic CRUD works.  
- [ ] Restart service; ensure data persistence (issues/pages retained).  
- [ ] Verify logs and backup commands per ops doc.  

---

## 🧱 Architecture & Operations Plan
- Deployment modes supported by Plane:  
  - AIO Docker image or Docker Compose/Swarm with setup scripts and env (`setup.sh`, `docker-compose.yaml`).  
  - See examples in Plane repo for AIO and Swarm/Compose invocation, logs, and upgrades.  
- We will standardize on a local dev recipe:  
  - Option A (AIO): one container with envs (DOMAIN_NAME, DATABASE_URL, REDIS_URL, AMQP_URL, S3 vars).  
  - Option B (Compose/Swarm): generated compose stack with separate services.  
- Documented commands (examples from upstream):  
  - Download setup scripts, run deployment, view logs, upgrade; see upstream guides for `setup.sh`/`swarm.sh` usage.  
- Networking: allocate Plane HTTP port via our port coordinator (worktree-safe).  
- Data: mount volumes for DB/Redis/S3 (MinIO) to retain state across restarts.  

Citations:  
- Docs overview: [Plane Docs](https://docs.plane.so/)  
- Self-host & deployments: [makeplane/plane README](https://github.com/makeplane/plane?tab=readme-ov-file)

---

## 📋 Technical Notes
- Do not import Plane into our Encore backend; treat as an external service we operate.  
- Provide `scripts/plane/` with helper scripts: start, stop, logs, backup, upgrade.  
- Update `CLAUDE.md` with quicklinks & troubleshooting, and add a `plane/README.md` for ops.

---

## 🏷️ Labels
`[integration]`, `[infra]`, `[docs]`, `[priority:P1]`, `[milestone:M6]`

---

## 📚 Related Documents
- `/jira/feature-requests/FR-013-jira-path-managed-plane/FR-013-main.md` (content sync follow-up)
- `.cursor/PORT_ISOLATION_ENFORCEMENT.md`

---

## Release Plan (PROC-001)
- Follow PROC-001 “Production Release” in `.cursor/procedures/PROCEDURES.md`
- Preconditions:
  - [ ] `@verify-worktree-isolation` passes
  - [ ] `@test-default-run` passes on this worktree
- Handoff:
  - After merge to main, run `@update_handoff` and choose the “Production Release Update” workflow
- Notes:
  - Frontend version bump (semver) required before tagging
  - Tag format: `v<frontend>-<date>-<shortsha>`

## Worktree Setup Quicklinks
- Isolation: `@verify-worktree-isolation`
- Start Backend: `./scripts/dev-backend.sh`
- Start Frontend: `./scripts/dev-frontend.sh`
- Smoke Test: `@test-default-run`

