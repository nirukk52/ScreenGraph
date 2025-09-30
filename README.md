# ScreenGraph
A repository where Junie Pro, OpenHands and Zep work together to build fullstack AI applications.


**Kotlin Full-Stack (KMP + Ktor) — Solo Workflow**

A lean, single-person setup using Kotlin Multiplatform (KMP) for shared code, Jetpack Compose for UI, and Ktor for the backend.
Execution model: three players—You(Niranjan) (lead & rescue), OpenHands (git-ops), Junie (edit-only).
Memory lives in Zep.

Keep all code modular. Use constants, enums where ever needed, proper commenting for each function no function bigger than 50 lines.

/shared             # Shared logic or classes across all layers
/web                # Frontend stuff
/backend            # Ktor backend + AI agent with Koog + DB postgres layer
/.github            # issue/PR templates + CI (added soon)

Reference monorepo project: https://github.com/JetBrains/kotlinconf-app

Three Players (separation of concerns)
You — decide scope, set/clarify NEXT, rescue work when agents stall
OpenHands — create Issues, attach to Project, scaffold branches, open/update PRs, move Status, post progress to zep
Junie — edit-only: code/tests/build in IDE; never runs git; posts progress to Zep

**Below is WIP:**

Every Issue is a feature request/task.

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


**Zep Graph**

Nodes
Feature (Issue): repo:<owner>/<repo>#<issue>
PR: pr:<owner>/<repo>#<pr>
Decision (ADR): adr:<yyyy-mm-dd>-<slug>
Thread: same key as Feature (per-Issue timeline)

**Edges**
summarized_in(Feature → Thread) — at Issue open
implements(PR → Feature) — at PR open/merge
decided_by(Feature → Decision) — whenever you capture a keeper/rejected ADR

**Truths & Memory**
Single Source of Truth: GitHub Projects (Status), GitHub Issues/PRs (work items)
Working Memory: Zep threads
Per-Issue Thread ID: repo:<owner>/<repo>#<issue>
Optional Epic Thread ID: epic:<slug> (requirements → seeds → multiple Issues)
Non-negotiables: “No ZEP_THREAD, no work” and “Single NEXT only”


**Flow:**
Start an Epic chat in Claude
Create epic:<slug> in Claude; write Goal, Constraints, Open Questions.
Add Issue Seeds (Title, single NEXT, tags, size/priority).
All of this lands in Zep automatically via the MCP server. 

Lock the plan → Harvest tickets
Tell OpenHands: “Create feature issues from Epic <slug> using these seeds; put the CTX block at top (incl. ZEP_THREAD: repo:…#id) and attach to Project Backlog.”
Now each Issue has its own per-Issue Zep thread (the rolling context).
From here, OpenHands handles PR lifecycle and posts PR-open/merge summaries back into the same thread.

Execute with Junie (edit-only)
“Junie, start work on issue N.” Junie (or you via Claude) reads the Issue thread: STATE, single NEXT, BLOCKERS, last_two_done, next_two, top 3 failures, last 2–3 Decisions (including Epic ones by matching tags).
After meaningful progress, Junie posts a Step Note (≤6 lines) to the same thread; at session end, a Session Summary (≤7).
Threads are just Zep “messages”; Zep’s API ingests them and updates the knowledge graph automatically. 

PR events
OpenHands opens a PR → links implements(PR→Feature) and adds a short PR-open note to the Issue thread; merge does the same and marks Feature Done.

**WIP Zep architecture:**
| **Node**                          | **ID Format**                 | **Key Properties (keep tiny)**                                                                                                                                                                                                                                                                                          | **When Created**                                                | **Purpose / Notes**                                                          |
| --------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Feature (Issue)**               | `repo:<owner>/<repo>#<issue>` | `title`, `status` *(Backlog/In-Progress/In-Review/Done)*, `current_state`, `next_step` *(single, active)*, `links`, `last_two_done` *(max 2)*, `next_two` *(max 2)*, `failures` *(max 5)*, `tags{module, capability, error_code?}`, `owner` *(Human/Junie/OpenHands)*, `priority` *(H/M/L)*, `rescue_by_human` *(bool)* | When the GitHub Issue is opened                                 | Anchor for all work on a task/feature/bug. Keep it minimal and always fresh. |
| **PR**                            | `pr:<owner>/<repo>#<pr>`      | `state` *(draft/open/merged/closed)*, `branch`, `merged_at`, `links`                                                                                                                                                                                                                                                    | When a PR is opened from that Issue                             | Connects git history to the Feature; drives status changes.                  |
| **Decision (ADR)**                | `adr:<yyyy-mm-dd>-<slug>`     | `summary`, `rationale`, `alternatives`, `status` *(accepted/rejected)*, `tags{module, capability}`                                                                                                                                                                                                                      | Whenever you make a keeper choice or record a rejected approach | Durable memory of *why*; powers future consistency.                          |
| **Thread** *(per-issue timeline)* | same as Feature               | Ordered notes (Step Notes & Session Summaries), latest `STATE/NEXT/BLOCKERS`, `links`, `tags`                                                                                                                                                                                                                           | Immediately at Issue open                                       | Working memory Junie reads first and updates after each step/session.        |

| **Edge**          | **From → To**      | **When to Create**                    | **Why it’s useful**                                                      |
| ----------------- | ------------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| **summarized_in** | Feature → Thread   | At Issue open (always)                | Binds the Feature to its single source of narrative truth.               |
| **implements**    | PR → Feature       | When the PR is opened for that Issue  | Lets you query “what shipped for this Feature?” and build release notes. |
| **decided_by**    | Feature → Decision | When you record a keeper/rejected ADR | Lets Junie and you honor past choices and avoid repeats.                 |

| **Note Type**       | **When**                                               | **Fields (≤6–7 lines)**                                                            | **Why**                                                                                                |
| ------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Step Note**       | After meaningful progress, NEXT change, blocker change | `STATE`, `NEXT` *(single)*, `DONE?`, `FAILED? (why + alt)`, `BLOCKERS`, `EVIDENCE` | High-signal breadcrumbs; updates `current_state/next_step`, rotates `last_two_done/next_two/failures`. |
| **Session Summary** | End of focused session or before stopping              | `DONE (2–4)`, `NEXT (1–2)`, `FAILED (0–2)`, `DECISIONS (0–2)`                      | Compact snapshot that keeps recall sharp without transcripts.                                          |


| **Stage**       | **Who**         | **Actions**                                                            | **Edges/Props touched**                                                                  |
| --------------- | --------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1) Issue opened | You / OpenHands | Create Feature + Thread; set CTX (`STATE=Not started`, `NEXT=<first>`) | Add **summarized_in**; set core props                                                    |
| 2) Work begins  | Junie (or You)  | Edit → tests → Step Notes; optional Session Summary                    | Refresh `current_state/next_step`; rotate `last_two_done/next_two/failures`              |
| 3) PR opened    | OpenHands       | Open branch & PR; link to Issue                                        | Add **implements**; Project `Status=In-Review` when ready                                |
| 4) Merge        | OpenHands       | Merge PR; close Issue                                                  | Feature `status=Done`; freeze `current_state` (“Merged via #PR”); add ADR if DoD changed |
