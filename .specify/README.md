
# ScreenGraph Specification System

> **Purpose**: Spec-Driven Development workflow for ScreenGraph features  
> **Based on**: [GitHub spec-kit](https://github.com/github/spec-kit) - MIT Licensed

---

## Overview

This directory contains our spec-driven development system, based on GitHub's spec-kit toolkit. We follow a structured workflow from specification → planning → implementation.

**Integration**:
- **Local scripts**: `.specify/scripts/` - Our customized workflow scripts
- **Templates**: `.specify/templates/` - Specification and planning templates
- **Official spec-kit**: `tools/spec-kit/official/` - Git submodule tracking upstream

---

## Workflow Commands

### Create New Feature Specification
```bash
bun run spec:new
# or directly:
bash .specify/scripts/bash/create-new-feature.sh --json "Feature description here"
```

### Update CLAUDE.md Context
```bash
bun run spec:update
```

---

## Directory Structure

```
.specify/
├── memory/              # Project constitution and context
├── scripts/
│   └── bash/
│       ├── common.sh                  # Shared utilities
│       ├── create-new-feature.sh      # New feature workflow
│       ├── setup-plan.sh              # Planning phase
│       ├── check-prerequisites.sh     # Validation checks
│       └── update-agent-context.sh    # Context refresh
└── templates/
    ├── spec-template.md              # Feature specification template
    ├── plan-template.md              # Implementation plan template
    ├── tasks-template.md             # Task breakdown template
    ├── checklist-template.md         # Quality checklist template
    └── agent-file-template.md        # Agent context template

specs/
└── NNN-feature-name/              # Generated feature specs
    ├── spec.md                    # ← WHAT: Feature specification
    ├── plan.md                    # ← HOW: Implementation plan
    ├── tasks.md                   # ← DO: Task breakdown
    └── checklists/
        └── requirements.md        # Quality validation
```

---

## Spec-Driven Development Process

### Phase 1: Specification (`/speckit.specify`)

**Input**: Natural language feature description  
**Output**: `specs/NNN-feature-name/spec.md`

**Purpose**: Define WHAT we're building and WHY, without implementation details.

**Key sections**:
- User scenarios and workflows
- Functional requirements
- Success criteria (measurable, technology-agnostic)
- Assumptions and constraints

**Quality gates**:
- No implementation details (frameworks, languages, APIs)
- All requirements are testable
- Success criteria are measurable
- Maximum 3 [NEEDS CLARIFICATION] markers

---

### Phase 2: Planning (`/speckit.plan`)

**Input**: `spec.md` + technology constraints  
**Output**: `specs/NNN-feature-name/plan.md`

**Purpose**: Define HOW we'll implement the feature with specific technologies.

**Includes**:
- Technology stack decisions
- Architecture patterns
- Component breakdown
- API contracts
- Data models
- Integration points

---

### Phase 3: Task Breakdown (`/speckit.tasks`)

**Input**: `plan.md`  
**Output**: `specs/NNN-feature-name/tasks.md`

**Purpose**: Break implementation into ordered, actionable tasks.

**Features**:
- Dependency-aware ordering
- Parallel execution markers `[P]`
- File path specifications
- Test-driven structure
- Checkpoint validations

---

### Phase 4: Implementation (`/speckit.implement`)

**Input**: `tasks.md`  
**Output**: Working code

**Process**:
- Validates prerequisites
- Executes tasks in order
- Respects dependencies
- Follows TDD approach
- Provides progress updates

---

## Integration with ScreenGraph

### Cursor Commands

The spec-kit workflow is integrated via Cursor commands in `.cursor/commands/`:

- **`speckit.specify.md`** - Create feature specification
- **`speckit.plan.md`** - Generate implementation plan
- **`speckit.tasks.md`** - Break down into tasks
- **`speckit.implement.md`** - Execute implementation

### Alignment with Founder Rules

All specifications must respect:
- **Architecture boundaries**: Backend/frontend separation
- **Type safety**: No `any` types, explicit DTOs
- **Naming conventions**: Descriptive function names (verbNoun)
- **Logging standards**: `encore.dev/log` only
- **Testing philosophy**: Flow reliability over edge cases

See `.cursor/rules/founder_rules.mdc` for complete standards.

---

## Example: E2E Drift Detection Flow

**User prompt**:
```
/speckit.specify I want to validate the existing "Detect My Drift" flow with a proper E2E spec:
- User clicks "Detect My Drift" button
- Appium starts automatically
- Backend starts the run
- Frontend navigates to /run/{id}
- Events are published and displayed
- Screenshots are captured and shown in gallery

This needs cleanup, guards, and determinism.
```

**Generated structure**:
```
specs/001-e2e-drift-flow/
├── spec.md              # User scenarios, requirements, success criteria
├── plan.md              # Appium integration, E2E test structure
├── tasks.md             # Ordered implementation tasks
└── checklists/
    └── requirements.md  # Quality validation
```

---

## Maintenance

### Updating Spec-Kit

```bash
cd tools/spec-kit/official
git pull origin main
cd ../../..
git add tools/spec-kit/official
git commit -m "chore: update spec-kit to latest"
```

### Customizing Templates

Edit templates in `.specify/templates/` - these take precedence over spec-kit defaults.

### Adding New Scripts

Add to `.specify/scripts/bash/` and reference in `package.json`:

```json
"spec:custom": "bash .specify/scripts/bash/your-script.sh"
```

---

## References

- [GitHub spec-kit](https://github.com/github/spec-kit) - Official repository
- [Spec-Kit Documentation](https://github.com/github/spec-kit/blob/main/docs/) - Detailed guides
- [CLAUDE.md](../CLAUDE.md) - Project quick reference
- [Founder Rules](../.cursor/rules/founder_rules.mdc) - Development standards

---

**Last Updated**: 2025-11-10  
**Spec-Kit Version**: Tracking `main` branch via submodule

