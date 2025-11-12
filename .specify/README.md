# .specify — Spec-Driven Development

**One location for all specs, commands, and constitution.**

---

## Quick Start

### Create a Spec (3 commands)

```bash
/speckit.specify "your feature idea"   # Creates spec.md
/speckit.plan                          # Creates plan.md  
/speckit.tasks                         # Creates tasks.md
```

That's it. Three files created in `.specify/specs/[feature-name]/`

---

## Structure

```
.specify/
├── commands/          All speckit commands
├── templates/         Reusable templates
├── scripts/           Helper bash scripts
├── memory/
│   └── constitution.md   5 principles (spec-first, test-first, etc.)
└── specs/             ALL work items
    ├── bugs/
    ├── features/
    └── tech-debt/
```

---

## The Pattern

Every work item has **3 files**:

```
.specify/specs/[type]/[name]/
├── spec.md     WHAT we're solving
├── plan.md     HOW we'll solve it
└── tasks.md    STEPS to implement
```

---

## Constitution (5 Principles)

1. **Spec-First** — Everything starts in `.specify/specs/`
2. **Language Boundaries** — TypeScript (services), Python (tooling), Svelte (UI)
3. **Test-First** — RED-GREEN-REFACTOR cycle
4. **Observable** — Structured logging everywhere
5. **Python Tooling** — All automation/skills in Python

See: `memory/constitution.md`

---

## Commands

All in `.specify/commands/`:
- `speckit.specify` — Create spec
- `speckit.plan` — Create implementation plan
- `speckit.tasks` — Break into tasks
- `speckit.implement` — Generate code
- `speckit.checklist` — Validation checklist
- `speckit.analyze` — Analyze existing code
- `speckit.clarify` — Ask clarifying questions
- `speckit.constitution` — Update constitution

---

## Related Systems

- `.claude-skills/` — AI workflows (Python)
- `vibes/` — Engineering personas (backend, frontend, infra, qa)

---

**Ready to use.** Run `/speckit.specify` to start.
