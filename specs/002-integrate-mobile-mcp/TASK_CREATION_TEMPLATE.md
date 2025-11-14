# Task Creation Template: Using Sequential Thinking

**Purpose**: Standardized process for decomposing spec phases into actionable task batches  
**Method**: Sequential Thinking MCP (5-step reasoning about dependencies, ordering, exit criteria)  
**Output**: Task markdown files + todo_write batches

---

## The 5-Step Sequential Thinking Process

### Step 1: Understand Dependencies & Constraints

**Goal**: Map what must happen first, what can run in parallel, and which tasks have hard prerequisites.

**Questions to Answer**:
- What task **blocks** everything else?
- Which tasks are **independent** (can run parallel)?
- What's the **critical path** (longest chain)?
- Are there **circular dependencies**?

**Example** (Phase 2A):
- Screenshot adapter **blocks** nothing (Phase 2B/2C can start while 2A progresses)
- WebDriverIO reading and mobile-mcp API reading are **parallel**
- Implementation tasks depend on reading phase
- Testing depends on implementation

**Output**: Dependency graph showing critical path

---

### Step 2: Decompose Into Granular Tasks

**Goal**: Break the phase into implementable chunks (1-2 hour tasks, not 8-hour marathons).

**Questions to Answer**:
- What's the **minimum viable step**?
- Can this be tested independently?
- Are there **clear entry/exit criteria**?
- What files are touched?

**Example** (Phase 2A Screenshot):
- **Instead of**: "Implement screenshot adapter" (vague, 8 hours)
- **Decompose to**:
  - T064: Create file `backend/agent/adapters/mobile/perception.adapter.ts`
  - T065: Implement `captureScreenshot()` method
  - T066: Add base64 validation
  - T067: Add error handling
  - ... (more granular tasks)

**Output**: Task list with exact file paths, clear single responsibilities

---

### Step 3: Assign IDs, Priorities & Grouping

**Goal**: Create a sequential numbering scheme and tag for parallelization.

**Numbering Convention**:
- Phases get 30-task blocks: T060-T089 (Phase 2A), T090-T119 (Phase 2B), etc.
- Tasks numbered sequentially within phase
- Reserve last few numbers for exit criteria tasks

**Tagging**:
- `[P]` = Can run in Parallel (no file conflicts, no inter-dependencies)
- `P0` = Blocking (must complete before phase exits)
- `P1` = Important (nice-to-have, non-blocking)

**Example** (Phase 2A):
- T060: [P] = Reading tasks can parallelize
- T064-T069: [no tag] = implementation tasks sequential
- T070-T080: [P] = tests can parallelize if mocked
- T081-T085: [P] = quality tasks can parallelize

**Output**: Task list with IDs, tags, and priority labels

---

### Step 4: Define Exit Criteria Per Phase

**Goal**: Make "phase complete" objective and measurable.

**Questions to Answer**:
- What tests **must pass**?
- Are there **performance targets**?
- What **regressions** would block merge?
- How do we **verify** success?

**Example** (Phase 2A Exit Criteria):
```
✅ Mobile screenshot adapter compiles (tsc --noEmit)
✅ All unit tests pass (encore test agent/adapters/mobile/perception.adapter.test.ts)
✅ Live emulator test passes (screenshot captured successfully)
✅ Performance ≤2s (same as Appium baseline)
✅ Feature flag gates implementation (flag OFF = uses WebDriverIO)
✅ No regressions in existing Appium tests
```

**Output**: Measurable exit gates that confirm "phase done"

---

### Step 5: Synthesize & Validate the Plan

**Goal**: Step back and verify the plan is correct, complete, and achievable.

**Questions to Answer**:
- Is the **dependency order** correct?
- Can **parallel tasks** really run together?
- Are **all files** covered?
- Is **timing realistic** (32 hours for Phase 2+)?
- Are there **missing tasks**?

**Example** (Phase 2+ Validation):
- ✅ Phase 2A doesn't block 2B/2C (can parallelize screenshot+input+lifecycle)
- ✅ Phase 2D (cleanup) depends on all 2A-2C (correct - can't test cleanup without implementations)
- ✅ Phase 3A E2E depends on 2D (correct - cleanup needed for proper test)
- ✅ All files covered: perception, input, lifecycle, cleanup adapters
- ✅ Timeline: 8h (2A) + 8h (2B) + 6h (2C) + 4h (2D) + 4h (3A) + 3h (3B) = 33 hours ✅

**Output**: Validated, realistic plan ready for execution

---

## Template: Applying Sequential Thinking to Your Task

### When You're Asked to Create Tasks:

**Input**: Feature spec (what to build) + timeline estimate  
**Process**:

1. **Read the spec carefully**
   - What are the user stories?
   - What are the success criteria?
   - What components need to change?

2. **Use Sequential Thinking MCP** (call 5 times):
   ```
   Thought #1: Understanding dependencies
   Thought #2: Decomposing into granular tasks
   Thought #3: Assigning IDs and priorities
   Thought #4: Defining exit criteria
   Thought #5: Synthesizing & validating
   ```

3. **Create the Task Markdown File**
   - Follow the format in `PHASE_2_OPERATIONS_TASKS.md`
   - Group tasks by sub-phase (2A, 2B, 2C, 2D)
   - Include setup, implementation, testing, integration, quality, exit criteria
   - Use exact file paths, test commands, exit gates

4. **Create Todo Batch**
   - Use `todo_write` with `merge: true`
   - One todo per major task or task batch
   - Include phase name, duration, and key deliverables
   - Link back to task.md sections

5. **Document in Spec**
   - Link from tasks.md to new Phase file
   - Update status: "Phase 2 Ready" or "Phase 2 In Progress"
   - Add timeline and critical path info

**Output**: 
- Markdown task file (30-60 tasks per phase)
- Todo batch (3-5 todos per phase)
- Cross-linked spec/plan/tasks documents

---

## Example: Creating Phase 2A Tasks Using This Template

### Step 1: Understand Dependencies

**Question**: What must happen first in Phase 2A (Screenshot)?  
**Analysis**:
- Need to understand WebDriverIO implementation → read existing adapter
- Need to understand mobile-mcp API → read encore.service.ts
- These are independent → can parallelize
- Implementation depends on both readings
- Testing depends on implementation
- Exit criteria: tests pass + perf <2s + no regressions

**Output**: Dependencies mapped, reading tasks parallelizable

### Step 2: Decompose

**Breaking down "Screenshot Migration"**:
- Reading phase (4 tasks, parallel)
  - T060: Read WebDriverIO
  - T061: Read mobile-mcp APIs
  - T062: Document comparison
  - T063: Baseline performance
- Implementation phase (6 tasks, sequential)
  - T064: Create file
  - T065: Implement method
  - T066: Validation
  - T067: Error handling
  - T068: Port update
  - T069: Wire into agent
- Testing phase (11 tasks, mostly parallel)
  - T070-T075: Unit tests + live test
- Integration & Quality (10 tasks, parallel)
  - T076-T085: Integration, linting, docs

**Output**: 31 specific tasks with clear ownership

### Step 3: Assign IDs & Tags

```
T060 [P] = Read WebDriverIO (can parallel with T061)
T061 [P] = Read mobile-mcp API (can parallel with T060)
T062 = Document comparison plan (sequential, depends on both)
T063 [P] = Baseline perf (can run anytime, informational)
T064 = Create mobile perception adapter (sequential, depends on analysis)
T065 [P] = Implement captureScreenshot (independent method)
T066 [P] = Add validation (independent method)
T067 [P] = Add error handling (independent method)
T068 = Update perception port (sequential, depends on all methods)
T069 = Wire into agent (sequential, depends on port update)
T070 [P] = Create unit tests (independent, can mock)
T071 [P] = Mock responses (independent)
...etc
```

**Output**: IDs assigned, parallelizable tasks tagged

### Step 4: Define Exit Criteria

```
✅ Mobile screenshot adapter compiles
✅ All unit tests pass (T070-T075)
✅ Live emulator test passes (T073)
✅ Performance ≤2s (T074)
✅ Feature flag gates implementation (T076)
✅ No regressions in Appium tests (T079)
```

**Output**: Measurable exit gates

### Step 5: Validate Plan

**Check**: Is this realistic?
- Reading: 1-2 hours (T060-T063) ✅
- Implementation: 2-3 hours (T064-T069) ✅
- Testing: 2-3 hours (T070-T080) ✅
- Integration & Docs: 1-2 hours (T081-T085) ✅
- **Total: 6-10 hours ✅** (within 8-hour estimate)

**Check**: Can Phase 2B/2C start while 2A progresses?
- Yes, they have different adapters (perception vs input vs lifecycle)
- No file conflicts
- Only constraint: Phase 2D cleanup needs all 3 done first ✅

**Output**: Validated, realistic 8-hour Phase 2A plan

---

## Using This Template Going Forward

### For Phase 2A (Screenshot):
1. Create detailed task file: `PHASE_2A_SCREENSHOT_TASKS.md` (or expand PHASE_2_OPERATIONS_TASKS.md)
2. Create todo batch with 3-5 todos covering setup, implement, test, quality
3. Mark Phase 2A status: "In Progress" with link to task file

### For Phase 2B (Input):
1. Create task file: `PHASE_2B_INPUT_TASKS.md`
2. Create todo batch (can run parallel with 2A)
3. Mark Phase 2B status

### For Phase 2C (Lifecycle):
1. Create task file: `PHASE_2C_LIFECYCLE_TASKS.md`
2. Create todo batch (can run parallel with 2A, 2B)
3. Mark Phase 2C status

### For Phase 2D (Cleanup):
1. Depends on 2A-2C completion
2. Mark Phase 2D: "Blocked until 2A-2C complete"
3. Create task file once 2A-2C done

### For Phase 3A (E2E):
1. Depends on 2D completion
2. Straightforward E2E validation
3. Full run with mobile-mcp only

### For Phase 3B (Docs):
1. Depends on 3A completion
2. Migration guide, handoff docs
3. Preparation for merge to main

---

## Checklist: Creating Tasks Using Sequential Thinking

- [ ] **Thought #1**: Dependency analysis complete (what blocks what?)
- [ ] **Thought #2**: Granular task decomposition (1-2 hour tasks)
- [ ] **Thought #3**: ID assignments & parallelization tags
- [ ] **Thought #4**: Exit criteria defined (measurable gates)
- [ ] **Thought #5**: Plan validated (realistic, complete, achievable)
- [ ] **Output #1**: Task markdown file created (30+ tasks)
- [ ] **Output #2**: Todo batch created (3-5 high-level todos)
- [ ] **Output #3**: Spec/plan/tasks linked (cross-references)
- [ ] **Status**: Phase marked in tasks.md with progress indicator

---

## Template Status

**Current Phases**:
- ✅ Phase 1 (T001-T059): Complete
- 📋 Phase 2A-2D (T060-T169): Defined in `PHASE_2_OPERATIONS_TASKS.md`
- 📋 Phase 3A-3B (T170-T210): Defined in `PHASE_2_OPERATIONS_TASKS.md`

**Ready to Use**:
- ✅ Sequential Thinking 5-step process (proven on Phase 2+)
- ✅ Task numbering scheme (T060+)
- ✅ Parallelization tagging ([P])
- ✅ Exit criteria format

**Next Phase**: Start Phase 2A (Screenshot Migration) with todo set to `in_progress`

