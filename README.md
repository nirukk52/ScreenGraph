# ScreenGraph

A repository where **Junie Pro**, **OpenHands**, and **Zep** work together to build full-stack AI applications.

---

## Kotlin Full-Stack (KMP + Ktor) — Solo Workflow

A lean, single-person setup using:

- **Kotlin Multiplatform (KMP)** for shared code  
- **Jetpack Compose** for UI  
- **Ktor** for the backend  

**Execution Model:** Three players  
- **You (Niranjan)** → lead & rescue  
- **OpenHands** → git-ops
- **Junie** → edit-only write code with full context help in creating context as needed.

**Memory lives in Zep.**

**Guidelines:**
- Keep all code modular  
- Use constants/enums wherever possible  
- Comment every function  
- No function > 50 lines  

**Project Structure:**
/shared # Shared logic or classes across all layers
/web # Frontend stuff
/backend # Ktor backend + AI agent with Koog + DB postgres layer
/.github # Issue/PR templates + CI (coming soon)



**Reference Monorepo:** [JetBrains/kotlinconf-app](https://github.com/JetBrains/kotlinconf-app)

---

## Three Players (Separation of Concerns)

- **You** → decide scope, clarify NEXT, rescue stalled work  
- **OpenHands** → create Issues, attach to Project, scaffold branches, open/update PRs, manage Status, post to Zep  
- **Junie** → edit-only (code/tests/build in IDE), never runs git, posts progress to Zep  

---

Everything below this is WIP ideas that I have jotted down.

## Issue Format (WIP)

Every issue = a feature request or task.

ISSUE: repo:<owner>/<repo>#<id>
FEATURE: <short_name>
STATE: Not started
NEXT: <first concrete step>
BLOCKERS: N/A
LINKS: <issue URL>
OWNER: <OpenHands|Junie|Human>
PRIORITY: <High|Medium|Low>
RESCUE_BY_HUMAN: false
TAGS: module=<:shared|:server|:androidApp|:iosApp|:koog-agents>, capability=<auth|networking|persistence|ui-compose|build-ci|agents>
ZEP_THREAD: zep://threads/repo:<owner>/<repo>#<id>


---

## Zep Graph

### Nodes
- **Feature (Issue):** `repo:<owner>/<repo>#<issue>`  
- **PR:** `pr:<owner>/<repo>#<pr>`  
- **Decision (ADR):** `adr:<yyyy-mm-dd>-<slug>`  
- **Thread:** same key as Feature (per-Issue timeline)  

### Edges
- **summarized_in** (Feature → Thread) → at Issue open  
- **implements** (PR → Feature) → at PR open/merge  
- **decided_by** (Feature → Decision) → when ADR captured  

### Truths & Memory
- **SSOT:** GitHub Projects (status), Issues/PRs (work items)  
- **Working Memory:** Zep threads  
- **Per-Issue Thread ID:** `repo:<owner>/<repo>#<issue>`  
- **Optional Epic Thread ID:** `epic:<slug>`  
- **Non-negotiables:**  
  - “No ZEP_THREAD, no work”  
  - “Single NEXT only”  

---

## Flow

1. **Epic Planning**  
   - Start an Epic chat in Claude  
   - Create `epic:<slug>` with Goal, Constraints, Open Questions  
   - Add Issue Seeds (Title, NEXT, tags, priority)  
   - Seeds land in Zep via MCP server  

2. **Lock Plan → Harvest Tickets**  
   - Tell OpenHands: *“Create feature issues from Epic <slug> …”*  
   - Each Issue gets a per-Issue Zep thread  
   - OpenHands manages PR lifecycle + posts summaries  

3. **Execution with Junie (edit-only)**  
   - Command: *“Junie, start work on issue N.”*  
   - Junie reads Issue thread (STATE, NEXT, BLOCKERS, decisions)  
   - Posts **Step Notes** (≤6 lines) and **Session Summaries** (≤7 lines)  
   - Threads auto-update via Zep API  

4. **PR Lifecycle**  
   - OpenHands opens PR → links `implements` edge + note in thread  
   - Merge marks Feature Done, updates thread, adds ADR if needed  

---

## Zep Architecture (WIP)

### Nodes

| **Node**        | **ID Format**             | **Properties** | **Created When** | **Purpose** |
|-----------------|---------------------------|----------------|------------------|-------------|
| **Feature**     | `repo:<owner>/<repo>#id` | title, status, current_state, next_step, links, last_two_done, next_two, failures, tags, owner, priority, rescue_by_human | Issue open | Anchor for all work |
| **PR**          | `pr:<owner>/<repo>#pr`   | state, branch, merged_at, links | PR open | Connects git → Feature |
| **Decision**    | `adr:<yyyy-mm-dd>-slug`  | summary, rationale, alternatives, status, tags | ADR recorded | Durable memory of *why* |
| **Thread**      | same as Feature          | notes, STATE/NEXT/BLOCKERS, links, tags | Issue open | Working memory |

### Edges

| **Edge**        | **From → To**   | **When** | **Why** |
|-----------------|-----------------|----------|---------|
| summarized_in   | Feature → Thread | Issue open | Binds narrative truth |
| implements      | PR → Feature    | PR open  | Links shipped work |
| decided_by      | Feature → ADR   | ADR log  | Honors past choices |

### Notes

| **Note Type**   | **When** | **Fields** | **Purpose** |
|-----------------|----------|------------|-------------|
| Step Note       | After progress / NEXT change | STATE, NEXT, DONE?, FAILED?, BLOCKERS, EVIDENCE | Breadcrumbs |
| Session Summary | End of session | DONE, NEXT, FAILED, DECISIONS | Compact snapshot |

### Stages

| **Stage** | **Who** | **Actions** | **Edges/Props** |
|-----------|---------|-------------|-----------------|
| 1. Issue opened | You / OpenHands | Create Feature + Thread, set CTX | summarized_in |
| 2. Work begins  | Junie / You | Edit, tests, notes | Update state/props |
| 3. PR opened    | OpenHands | Open PR, link to Issue | implements |
| 4. Merge        | OpenHands | Merge PR, close Issue | status=Done, freeze state |
