# ScreenGraph MCP Orchestrator

**A meta-MCP that intelligently suggests which MCPs to use for any task.**

## Purpose

The ScreenGraph MCP Orchestrator sits on top of all your MCPs and helps you decide which tools to use. Instead of manually figuring out "should I use encore-mcp or browser MCP?", just ask the orchestrator!

## Features

- ✅ **Intelligent routing** - Analyzes task and recommends relevant MCPs
- ✅ **Usage guidance** - Provides examples and workflow suggestions  
- ✅ **Self-improving** - Tracks effectiveness to improve future recommendations
- ✅ **ScreenGraph-aware** - Knows your project architecture and patterns

## Installation

### 1. Install Dependencies

```bash
cd .mcp-servers/screengraph-orchestrator
pip install -r requirements.txt
```

### 2. Configure in Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json` or settings):

```json
{
  "mcpServers": {
    "screengraph-orchestrator": {
      "command": "python",
      "args": [
        "/absolute/path/to/.mcp-servers/screengraph-orchestrator/server.py"
      ]
    }
  }
}
```

### 3. Restart Cursor

The orchestrator will now be available!

## Tools

### `suggest_mcps` (THE ONLY TOOL YOU NEED)

**Simple, brief recommendations. No fluff.**

```typescript
suggest_mcps(task: "Fix agent hanging on device connection")

// Returns (brief):
// Vibe: backend_vibe (skills: backend-debugging, backend-development)
//
// 1. graphiti - Search for past solutions
// 2. encore-mcp - Inspect backend state
// 3. sequential-thinking - Systematic debugging
```

**That's it.** The vibe to use + three MCPs, prioritized.

### Optional: Detailed Mode

If you want more info, set `include_examples: true`:

```typescript
suggest_mcps(
  task: "Fix agent hanging",
  include_examples: true  // Verbose mode
)

// Returns:
// - Detailed purpose for each MCP
// - Specific tools to call
// - When to use each
// - Workflow guidance
```

**But honestly?** You probably don't need it. The brief version tells you everything.

## Workflow Integration

### The Simple Pattern:

```
1. @project-context [task]     ← Automatically calls suggest_mcps()
2. Use the 3 MCPs it suggests  ← Execute your task
3. Document in Graphiti        ← Save solution (group_id="screengraph")
```

**That's it.** Three steps. No complexity.

## Supported Task Types

The orchestrator understands these task categories:

- **Backend** - API, database, agent, Encore services
- **Frontend** - UI components, Svelte, routing, forms
- **Testing** - E2E, integration, Playwright
- **Deployment** - Vercel, AWS, CI/CD
- **Debugging** - Bug fixes, error investigation
- **Design** - Figma to code, UI implementation
- **Auth** - Authentication, sessions, permissions
- **Infrastructure** - AWS services, cloud resources
- **Appium** - Device connections, mobile testing

## What It Does

**Vibe-aware task routing:**
- Backend task? → `backend_vibe` + graphiti, encore-mcp, sequential-thinking
- Frontend task? → `frontend_vibe` + graphiti, svelte, browser
- Testing task? → `qa_vibe` + graphiti, browser, encore-mcp
- Infrastructure? → `infra_vibe` + graphiti, vercel, aws-api-mcp

**It understands your vibes layer** and tells you which vibe + MCPs to use.

Each vibe includes:
- Specific skills (e.g., backend-debugging, frontend-development)
- Domain-specific MCPs
- Rules and workflows
- Extends base_vibe (graphiti, context7, sequential-thinking)

## MCP Registry

Available MCPs:
1. **graphiti** - Institutional knowledge (ALWAYS use first)
2. **context7** - External library docs
3. **sequential-thinking** - Multi-step reasoning
4. **encore-mcp** - Backend introspection
5. **browser** - Frontend testing
6. **svelte** - Svelte 5 & SvelteKit docs (195 resources!)
7. **figma** - Design to code
8. **aws-knowledge-mcp** - AWS documentation
9. **aws-api-mcp** - AWS CLI execution
10. **vercel** - Deployment management
11. **better-auth** - Auth library docs

## Examples

### Example 1: Backend Bug Fix

```
Task: "Agent stalls when encountering privacy consent dialog"

Recommendations:
1. graphiti - Search for "privacy consent" or "agent stall" patterns
2. encore-mcp - Inspect agent state and run events
3. sequential-thinking - Systematic debugging approach

Workflow:
→ Search Graphiti for similar bugs
→ Use encore-mcp to check agent state
→ Add checkpoint logs to narrow location
→ Document solution in Graphiti
```

### Example 2: Frontend Feature

```
Task: "Build real-time run status component with SSE"

Recommendations:
1. graphiti - Search for "SSE" or "real-time component" patterns
2. svelte - Review Svelte 5 runes and SvelteKit docs
3. browser - Test component behavior

Workflow:
→ Search Graphiti for existing SSE patterns
→ Check svelte docs for $state and $effect usage
→ Implement component
→ Test with browser MCP
→ Document pattern in Graphiti
```

### Example 3: Deployment

```
Task: "Deploy frontend to Vercel production"

Recommendations:
1. graphiti - Check for deployment gotchas
2. vercel - Use deployment tools
3. aws-knowledge-mcp - If using AWS services

Workflow:
→ Search Graphiti for deployment issues
→ Use vercel.deploy_to_vercel()
→ Monitor deployment logs
→ Document any issues in Graphiti
```

## Self-Improvement

The orchestrator improves over time by tracking:
- Which MCP combinations work well together
- Common task patterns and their solutions
- Effectiveness of recommendations
- Missing tools or better routing strategies

Use `track_effectiveness()` after completing tasks to contribute to improvement!

## Troubleshooting

**Wrong MCPs suggested?**
- Be more specific: "backend API bug" not "bug"
- Include domain: "frontend component" not "component"

**Want to add a new MCP?**
- Edit `server.py` → `MCP_REGISTRY` (one entry)
- Add to `TASK_PATTERNS` (optional)
- Restart server

## Integration

`@project-context` automatically calls `suggest_mcps()`. You get recommendations without thinking about it.

---

**Created**: 2025-11-13  
**Maintainer**: ScreenGraph Project  
**License**: MIT

